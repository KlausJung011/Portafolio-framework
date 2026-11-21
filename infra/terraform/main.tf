resource "oci_core_vcn" "portfolio" {
  compartment_id = var.compartment_ocid
  cidr_block     = var.vcn_cidr
  display_name   = "portafolio-vcn"
  dns_label      = "portafolio"
}
resource "oci_core_internet_gateway" "portfolio" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio.id
  display_name   = "portafolio-internet"
  enabled        = true
}
resource "oci_core_route_table" "portfolio" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio.id
  display_name   = "portafolio-routes"
  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.portfolio.id
  }
}
resource "oci_core_security_list" "portfolio" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio.id
  display_name   = "portafolio-security"
  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }
  dynamic "ingress_security_rules" {
    for_each = toset([80, 443])
    content {
      source   = "0.0.0.0/0"
      protocol = "6"
      tcp_options {
        min = ingress_security_rules.value
        max = ingress_security_rules.value
      }
    }
  }
  dynamic "ingress_security_rules" {
    for_each = toset(compact([var.runner_ssh_cidr, var.admin_ssh_cidr]))
    content {
      source   = ingress_security_rules.value
      protocol = "6"
      tcp_options {
        min = 22
        max = 22
      }
    }
  }
  ingress_security_rules {
    source   = "0.0.0.0/0"
    protocol = "1"
    icmp_options {
      type = 3
      code = 4
    }
  }
}
resource "oci_core_subnet" "portfolio" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.portfolio.id
  cidr_block                 = var.subnet_cidr
  display_name               = "portafolio-public-subnet"
  dns_label                  = "publica"
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_route_table.portfolio.id
  security_list_ids          = [oci_core_security_list.portfolio.id]
}
resource "oci_core_instance" "portfolio" {
  compartment_id      = var.compartment_ocid
  availability_domain = var.availability_domain
  display_name        = "portafolio-ubuntu-2404"
  shape               = var.shape
  create_vnic_details {
    subnet_id        = oci_core_subnet.portfolio.id
    assign_public_ip = true
    hostname_label   = "portafolio"
  }
  source_details {
    source_type             = "image"
    source_id               = var.ubuntu_2404_image_ocid
    boot_volume_size_in_gbs = 50
  }
  metadata = { ssh_authorized_keys = var.ssh_public_key }
}
