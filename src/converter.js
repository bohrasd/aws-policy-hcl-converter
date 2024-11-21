function escapeString(str) {
    return str.replace(/[\\"]/g, '\\$&')
             .replace(/\${/g, '${');  // Don't escape string interpolation
}

function convertHCLToJSON(hcl) {
    // Remove comments
    hcl = hcl.replace(/#.*$/gm, '').replace(/\/\/.*$/gm, '');
    
    // Add quotes around unquoted keys
    hcl = hcl.replace(/([{,]\s*)([a-zA-Z0-9_-]+)\s*=/g, '$1"$2" =');
    
    // Convert = to :
    hcl = hcl.replace(/\s*=\s*/g, ': ');
    
    // Add quotes around unquoted string values
    hcl = hcl.replace(/:\s*([a-zA-Z0-9_\-.*:\/]+)(\s*[,}\]])/g, ':"$1"$2');
    
    // Fix boolean and null values
    hcl = hcl.replace(/:\s*"(true|false|null)"/g, ':$1');
    
    // Fix numbers
    hcl = hcl.replace(/:\s*"(\d+)"(?!\d*")/g, ':$1');
    
    // Add missing commas between properties
    hcl = hcl.replace(/}(\s*[}\]])/g, '},$1')  // Add comma after closing brace
             .replace(/](\s*[}\]])/g, '],$1')   // Add comma after closing bracket
             .replace(/([^,{[\s])\s*\n\s*"[^"]+"\s*:/g, '$1,\n"') // Add comma between properties
             .replace(/([^,{[\s])\s*\n\s*([a-zA-Z0-9_-]+)\s*:/g, '$1,\n"$2":'); // Add comma between unquoted keys
    
    // Remove trailing commas
    hcl = hcl.replace(/,(\s*[}\]])/g, '$1');
    
    // Escape special characters in strings, but preserve interpolations
    hcl = hcl.replace(/"([^"]*?)"/g, (match, p1) => {
        return `"${escapeString(p1)}"`;
    });
    
    try {
        // Parse and re-stringify to ensure valid JSON
        return JSON.stringify(JSON.parse(hcl), null, 2);
    } catch (e) {
        throw new Error(`Invalid JSON after conversion: ${e.message}\nConverted HCL: ${hcl}`);
    }
}

module.exports = {
    convertHCLToJSON,
    escapeString
};
