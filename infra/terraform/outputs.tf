output "public_ip" { value = oci_core_instance.portfolio.public_ip }
output "instance_id" { value = oci_core_instance.portfolio.id }
output "vcn_id" { value = oci_core_vcn.portfolio.id }
output "subnet_id" { value = oci_core_subnet.portfolio.id }
output "url" { value = "https://${oci_core_instance.portfolio.public_ip}" }
