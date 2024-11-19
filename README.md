# AWS IAM Policy to Terraform HCL Converter

## Overview
This is a simple static site that helps you convert AWS IAM Policy JSON to Terraform HCL format. 

## Features
- Convert AWS IAM Policy JSON to Terraform HCL resource
- Easy-to-use interface
- Copy-to-clipboard functionality
- Responsive design

## How to Use
1. Paste your AWS IAM Policy JSON in the left textarea
2. Click "Convert"
3. The Terraform HCL equivalent will appear in the right textarea
4. Click "Copy HCL" to copy the converted policy

## Local Development
Simply open the `index.html` file in your web browser to use the converter.

## Notes
- Ensure you have a valid AWS IAM Policy JSON
- The converter wraps the policy in a `aws_iam_policy` Terraform resource
- Policy name and description are placeholders and should be customized

## Technologies Used
- HTML5
- JavaScript
- Bootstrap 5.2.3

## License
MIT License
