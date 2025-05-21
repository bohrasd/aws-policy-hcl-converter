// Extracted JavaScript functions and test logic

// Define stringFields constant
const stringFields = ['Sid', 'Effect'];

// Helper functions (copied from index.html)
function pluralize(word) {
    if (word === 'Resource' || word === 'Action') return word + 's';
    return word;
}

function formatArrayValue(values, indentLevel = 6) {
    const indent = ' '.repeat(indentLevel);
    if (!Array.isArray(values)) {
        return `["${values}"]`;
    }
    if (values.length === 1) {
        return `["${values[0]}"]`;
    }
    return `[\n${indent}  "${values.join(`",\n${indent}  "`)}"    \n${indent}]`;
}

// convertStatementToHCL function (modified version from index.html)
function convertStatementToHCL(stmt, forPolicyDoc = false) {
    const indent = forPolicyDoc ? '    ' : '        ';
    let block = forPolicyDoc ? '  statement {\n' : '      {\n';

    Object.entries(stmt).forEach(([key, value]) => {
        if (key === 'Condition' || key === 'Principal' || key === 'NotPrincipal') {
            return; // Skip these, they are handled later
        }

        const fieldName = forPolicyDoc ? pluralize(key).toLowerCase() : key;
        const isResourceOrActionType = ['Resource', 'NotResource', 'Action', 'NotAction'].includes(key);

        if (stringFields.includes(key)) { // Sid, Effect
            block += `${indent}${fieldName} = "${value}"\n`;
        } else if (isResourceOrActionType) {
            if (Array.isArray(value)) {
                block += `${indent}${fieldName} = ${formatArrayValue(value, indent.length)}\n`;
            } else { // Value is a string
                if (forPolicyDoc) {
                    // For policy doc, these fields always expect a list
                    block += `${indent}${fieldName} = ${formatArrayValue([value], indent.length)}\n`;
                } else {
                    // For resource HCL, it's a direct string assignment
                    block += `${indent}${fieldName} = "${value}"\n`;
                }
            }
        } else if (Array.isArray(value)) { // Handles any other potential array types
            block += `${indent}${fieldName} = ${formatArrayValue(value, indent.length)}\n`;
        } else { 
            block += `${indent}${fieldName} = "${value}"\n`;
        }
    });

    // Handle Principal/NotPrincipal specially
    ['Principal', 'NotPrincipal'].forEach(principalType => {
        if (stmt[principalType]) {
            const fieldName = forPolicyDoc ? principalType.toLowerCase() : principalType;
            if (typeof stmt[principalType] === 'string') {
                block += `${indent}${fieldName} = "${stmt[principalType]}"\n`;
            } else {
                block += `${indent}${fieldName} = {\n`;
                Object.entries(stmt[principalType]).forEach(([service, ids]) => {
                    const serviceIds = Array.isArray(ids) ? ids : [ids];
                    block += `${indent}  ${service} = ${formatArrayValue(serviceIds, indent.length + 2)}\n`;
                });
                block += `${indent}}\n`;
            }
        }
    });

    // Handle Condition separately
    if (stmt.Condition) {
        if (forPolicyDoc) {
            for (const [operator, conditions] of Object.entries(stmt.Condition)) {
                for (const [key, values] of Object.entries(conditions)) {
                    block += `${indent}condition {\n`;
                    block += `${indent}  test     = "${operator}"\n`;
                    block += `${indent}  variable = "${key}"\n`;
                    block += `${indent}  values   = ${formatArrayValue(values, indent.length + 2)}\n`;
                    block += `${indent}}\n`;
                }
            }
        } else {
            block += `${indent}Condition = {\n`;
            for (const [operator, conditions] of Object.entries(stmt.Condition)) {
                block += `${indent}  ${operator} = {\n`;
                for (const [key, values] of Object.entries(conditions)) {
                    block += `${indent}    "${key}" = ${formatArrayValue(values, indent.length + 4)}\n`;
                }
                block += `${indent}  }\n`;
            }
            block += `${indent}}\n`;
        }
    }

    block += forPolicyDoc ? '  }' : '      }';
    return block;
}

// convertToHCL function (from index.html)
function convertToHCL(policyJson) {
    try {
        const policy = JSON.parse(policyJson);

        if (!policy.Version) {
            throw new Error("Policy must include a 'Version' field");
        }
        if (!policy.Statement || !Array.isArray(policy.Statement)) {
            throw new Error("Policy must include a 'Statement' array");
        }
        policy.Statement.forEach((stmt, index) => {
            if (!stmt.Effect || !['Allow', 'Deny'].includes(stmt.Effect)) {
                throw new Error(`Statement ${index + 1} must include a valid 'Effect' field (Allow or Deny)`);
            }
            if (!stmt.Action && !stmt.Resource && !stmt.NotAction && !stmt.NotResource) {
                throw new Error(`Statement ${index + 1} must include at least one of 'Action', 'NotAction', 'Resource', or 'NotResource' fields`);
            }
        });

        const statements = policy.Statement;
        const statementBlocks = statements.map(stmt => convertStatementToHCL(stmt, true)).join('\n\n');
        const policyDocVersion = `data "aws_iam_policy_document" "policy" {
${statementBlocks}
}`;
        const resourceStatements = statements.map(stmt => convertStatementToHCL(stmt, false)).join(',\n');
        const jsonEncodeVersion = `resource "aws_iam_policy" "policy" {
  name        = "policy-name"
  description = "Policy Description"
  policy      = jsonencode({
    Version   = "2012-10-17"
    Statement = [
${resourceStatements}
    ]
  })
}`;
        return { policyDocVersion, jsonEncodeVersion };
    } catch (error) {
        // In a Node.js environment, it's better to console.error or throw
        console.error(`Error converting policy: ${error.message}`);
        // Or rethrow if you want the caller to handle it:
        // throw error; 
        return { 
            policyDocVersion: `Error: ${error.message}`, 
            jsonEncodeVersion: `Error: ${error.message}` 
        };
    }
}

// Test Case 1 JSON
const testCase1Json = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:List*",
        "logs:Get*",
        "logs:Describe*",
        "logs:TestMetricFilter",
        "logs:FilterLogEvents",
        "logs:StopLiveTail",
        "logs:StopQuery",
        "logs:*QueryDefinition",
        "cloudwatch:GenerateQuery"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}`;

// Test Case 2 JSON
const testCase2Json = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::example-bucket/object1",
        "arn:aws:s3:::example-bucket/object2"
      ]
    }
  ]
}`;

// --- Execution ---
console.log("--- Test Case 1 Results ---");
const results1 = convertToHCL(testCase1Json);
console.log("PolicyDocVersion:\n" + results1.policyDocVersion);
console.log("\nJsonEncodeVersion:\n" + results1.jsonEncodeVersion);

console.log("\n\n--- Test Case 2 Results ---");
const results2 = convertToHCL(testCase2Json);
console.log("PolicyDocVersion:\n" + results2.policyDocVersion);
console.log("\nJsonEncodeVersion:\n" + results2.jsonEncodeVersion);
