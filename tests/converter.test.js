const { convertHCLToJSON } = require('../src/converter');

describe('HCL to JSON converter', () => {
    test('converts simple IAM policy', () => {
        const input = [
            '{',
            '    Version = "2012-10-17"',
            '    Statement = [',
            '        {',
            '            Effect = "Allow"',
            '            Action = [',
            '                "s3:GetObject",',
            '                "s3:ListBucket"',
            '            ]',
            '            Resource = [',
            '                "arn:aws:s3:::example-bucket",',
            '                "arn:aws:s3:::example-bucket/*"',
            '            ]',
            '        }',
            '    ]',
            '}'
        ].join('\n');

        const expected = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        "arn:aws:s3:::example-bucket",
                        "arn:aws:s3:::example-bucket/*"
                    ]
                }
            ]
        };
        
        const result = convertHCLToJSON(input);
        expect(result).toBe(JSON.stringify(expected, null, 2));
    });

    test('handles string interpolation', () => {
        const input = [
            '{',
            '    Version = "2012-10-17"',
            '    Statement = [',
            '        {',
            '            Effect = "Allow"',
            '            Action = "s3:*"',
            '            Resource = "arn:aws:s3:::${var.bucket_name}/*"',
            '        }',
            '    ]',
            '}'
        ].join('\n');

        const expected = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": "s3:*",
                    "Resource": "arn:aws:s3:::${var.bucket_name}/*"
                }
            ]
        };
        
        const result = convertHCLToJSON(input);
        expect(result).toBe(JSON.stringify(expected, null, 2));
    });

    test('handles special characters and nested objects', () => {
        const input = [
            '{',
            '    Version = "2012-10-17"',
            '    Statement = [',
            '        {',
            '            Effect = "Allow"',
            '            Action = ["s3:Get*", "s3:List*"]',
            '            Resource = "arn:aws:s3:::test-bucket/path/with/special/chars/*"',
            '            Condition = {',
            '                StringLike = {',
            '                    "s3:prefix" = ["test/path/*"]',
            '                }',
            '            }',
            '        }',
            '    ]',
            '}'
        ].join('\n');

        const expected = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["s3:Get*", "s3:List*"],
                    "Resource": "arn:aws:s3:::test-bucket/path/with/special/chars/*",
                    "Condition": {
                        "StringLike": {
                            "s3:prefix": ["test/path/*"]
                        }
                    }
                }
            ]
        };
        
        const result = convertHCLToJSON(input);
        expect(result).toBe(JSON.stringify(expected, null, 2));
    });

    test('handles comments', () => {
        const input = [
            '{',
            '    # This is a comment',
            '    Version = "2012-10-17"',
            '    // Another comment',
            '    Statement = [',
            '        {',
            '            Effect = "Allow" # Inline comment',
            '            Action = "s3:*" // Another inline comment',
            '            Resource = "*"',
            '        }',
            '    ]',
            '}'
        ].join('\n');

        const expected = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": "s3:*",
                    "Resource": "*"
                }
            ]
        };
        
        const result = convertHCLToJSON(input);
        expect(result).toBe(JSON.stringify(expected, null, 2));
    });

    test('handles numeric values', () => {
        const input = [
            '{',
            '    Version = "2012-10-17"',
            '    Statement = [',
            '        {',
            '            Effect = "Allow"',
            '            Action = "s3:*"',
            '            Resource = "*"',
            '            Condition = {',
            '                NumericLessThan = {',
            '                    "s3:max-keys" = 100',
            '                }',
            '            }',
            '        }',
            '    ]',
            '}'
        ].join('\n');

        const expected = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": "s3:*",
                    "Resource": "*",
                    "Condition": {
                        "NumericLessThan": {
                            "s3:max-keys": 100
                        }
                    }
                }
            ]
        };
        
        const result = convertHCLToJSON(input);
        expect(result).toBe(JSON.stringify(expected, null, 2));
    });

    test('handles boolean values', () => {
        const input = [
            '{',
            '    Version = "2012-10-17"',
            '    Statement = [',
            '        {',
            '            Effect = "Allow"',
            '            Action = "s3:*"',
            '            Resource = "*"',
            '            Principal = {',
            '                AWS = "*"',
            '            }',
            '            Condition = {',
            '                Bool = {',
            '                    "aws:SecureTransport" = true',
            '                }',
            '            }',
            '        }',
            '    ]',
            '}'
        ].join('\n');

        const expected = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": "s3:*",
                    "Resource": "*",
                    "Principal": {
                        "AWS": "*"
                    },
                    "Condition": {
                        "Bool": {
                            "aws:SecureTransport": true
                        }
                    }
                }
            ]
        };
        
        const result = convertHCLToJSON(input);
        expect(result).toBe(JSON.stringify(expected, null, 2));
    });
});
