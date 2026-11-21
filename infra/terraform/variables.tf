variable "region" {
  type    = string
  default = "sa-saopaulo-1"
}
variable "compartment_ocid" { type = string }
variable "availability_domain" { type = string }
variable "ubuntu_2404_image_ocid" { type = string }
variable "ssh_public_key" { type = string }
variable "runner_ssh_cidr" {
  description = "IP publica /32 del runner, se actualiza en cada despliegue"
  type        = string
  validation {
    condition     = can(cidrnetmask(var.runner_ssh_cidr)) && endswith(var.runner_ssh_cidr, "/32")
    error_message = "Usa una direccion IPv4 /32 para SSH del runner."
  }
}
variable "admin_ssh_cidr" {
  description = "Origen SSH del administrador: IPv4 /32, 0.0.0.0/0 para cualquier IPv4 en la practica, o vacio"
  type        = string
  default     = ""
  validation {
    condition     = var.admin_ssh_cidr == "" || var.admin_ssh_cidr == "0.0.0.0/0" || (can(cidrnetmask(var.admin_ssh_cidr)) && endswith(var.admin_ssh_cidr, "/32"))
    error_message = "Usa una IPv4 publica /32, 0.0.0.0/0 para esta practica, o deja vacio."
  }
}
variable "shape" {
  type    = string
  default = "VM.Standard.E2.1"
}
variable "vcn_cidr" {
  type    = string
  default = "10.32.0.0/16"
}
variable "subnet_cidr" {
  type    = string
  default = "10.32.1.0/24"
}
