import * as gcp from "@pulumi/gcp";

/**
 * VPC Class for creating a Google Cloud VPC network with custom subnets.
 * This class is designed to provide a modular approach to VPC and subnet creation,
 * following best practices for security and SOC2 compliance.
 *
 * Best Practices:
 * - **Private Subnets**: Create private subnets for critical resources and public subnets for external-facing services.
 * - **Firewall Rules**: Restrict access to subnets based on the principle of least privilege.
 * - **Audit Logging**: Enable logging for all network-related activities.
 * - **Segmentation**: Use separate VPCs for different environments (e.g., development, staging, production).
 * - **Private Google Access**: Enable private access to Google services for security.
 */
export class VPC {
    vpc: gcp.compute.Network;
    subnets: gcp.compute.Subnetwork[] = [];

    /**
     * Constructor to create a VPC with multiple subnets.
     *
     * @param name The name of the VPC.
     * @param region The region where the VPC will be created.
     * @param subnetsConfig Array of subnet configurations with CIDR range and name.
     */
    constructor(
        name: string,
        region: string,
        subnetsConfig: { cidrRange: string; name: string }[],
        sourceRanges: string[],
        sshSourceRanges: string[]
    ) {
        // Create the VPC network
        this.vpc = new gcp.compute.Network(name, {
            autoCreateSubnetworks: false, // Disable auto subnet creation for custom subnets
        });

        // Create multiple subnets for the VPC
        subnetsConfig.forEach((subnetConfig) => {
            const subnet = new gcp.compute.Subnetwork(subnetConfig.name, {
                ipCidrRange: subnetConfig.cidrRange, // Define the CIDR range for the subnet
                region: region, // Specify the region
                network: this.vpc.id, // Associate the subnet with the VPC
                privateIpGoogleAccess: true, // Enable private access to Google APIs
            });

            this.subnets.push(subnet);
        });

        // Implement basic firewall rules for SOC2 compliance
        this.createFirewallRules(sourceRanges, sshSourceRanges);
    }

    /**
     * Creates firewall rules based on best practices for SOC2 compliance.
     *
     * - Restricts access to the VPC based on IP ranges and specific ports.
     * - Logs all network traffic for auditing purposes.
     */
    private createFirewallRules(
        sourceRanges: string[],
        sshSourceRanges: string[]
    ) {
        // Allow internal traffic within the VPC (for communication between VMs and services)
        new gcp.compute.Firewall("allow-internal", {
            network: this.vpc.id,
            allows: [
                { protocol: "tcp", ports: ["0-65535"] },
                { protocol: "udp", ports: ["0-65535"] },
                { protocol: "icmp" },
            ],
            sourceRanges: sourceRanges, // Allow internal IP ranges
            targetTags: ["internal"],
            direction: "INGRESS",
            logConfig: {
                metadata: "INCLUDE_ALL_METADATA", // Include all metadata for logging
            },
        });

        // Allow access for SSH (port 22) from trusted IP ranges (example: corporate IP)
        new gcp.compute.Firewall("allow-ssh", {
            network: this.vpc.id,
            allows: [{ protocol: "tcp", ports: ["22"] }],
            sourceRanges: sshSourceRanges, // Specify the trusted IP ranges
            direction: "INGRESS",
            logConfig: {
                metadata: "INCLUDE_ALL_METADATA", // Include all metadata for logging
            },
        });

        // Additional firewall rules can be added based on your security requirements
    }

    /**
     * Export VPC and Subnet details.
     *
     * @returns The VPC and Subnet details, including the IDs and names.
     */
    getVPCDetails() {
        const subnetDetails = this.subnets.map((subnet) => ({
            subnetName: subnet.name,
            subnetId: subnet.id,
        }));

        return {
            vpcName: this.vpc.name,
            vpcId: this.vpc.id,
            subnets: subnetDetails,
        };
    }
}
