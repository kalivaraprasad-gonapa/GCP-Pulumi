// import * as pulumi from "@pulumi/pulumi";
import { VPC } from "./modules/vpc";

// Retrieve the source ranges and subnets configuration securely
const subnetsConfigIndiaVPC = [
    { cidrRange: process.env.VPC_CIDR_RANGE_1 || "10.0.0.0/16", name: "vpc-subnet-1" },
    { cidrRange: process.env.VPC_CIDR_RANGE_2 || "10.1.0.0/16", name: "vpc-subnet-2" },
];

// Use environment variables for source ranges
const sourceRangesIndiaVPC = [process.env.VPC_SOURCE_RANGE || "10.0.0.0/8"];

// Create VPC instances
const indiaVPC = new VPC("india-vpc", process.env.GCP_REGION || "us-central1", subnetsConfigIndiaVPC, sourceRangesIndiaVPC);

// Export the VPC details
export const indiaVpcDetails = indiaVPC.getVPCDetails();
