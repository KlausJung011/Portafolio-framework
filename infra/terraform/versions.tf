terraform {
  required_version = ">= 1.12.0, < 2.0.0"
  required_providers {
    oci = { source = "oracle/oci", version = "~> 7.0" }
  }
  backend "oci" {}
}
provider "oci" {
  config_file_profile = "DEFAULT"
  region              = var.region
}
