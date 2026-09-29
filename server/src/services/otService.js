// Operational Transformation Service
// Implements basic OT algorithms for collaborative editing

class OTService {
  constructor() {
    this.operations = new Map(); // documentId -> operations[]
  }

  // Transform operation against another operation
  transform(op1, op2) {
    // Simplified OT transform
    // In production, use a library like ot.js or sharedb
    
    const ops1 = op1.ops || [];
    const ops2 = op2.ops || [];
    
    // This is a placeholder implementation
    // Real OT requires complex index transformation
    
    return {
      op1: this.transformOps(ops1, ops2),
      op2: this.transformOps(ops2, ops1)
    };
  }

  transformOps(ops1, ops2) {
    // Transform ops1 against ops2
    const result = [];
    let i = 0, j = 0;
    
    while (i < ops1.length && j < ops2.length) {
      const op1 = ops1[i];
      const op2 = ops2[j];
      
      if (op1.retain && op2.retain) {
        const min = Math.min(op1.retain, op2.retain);
        result.push({ retain: min });
        if (op1.retain > min) op1.retain -= min;
        else i++;
        if (op2.retain > min) op2.retain -= min;
        else j++;
      } else if (op1.insert) {
        result.push(op1);
        i++;
      } else if (op2.insert) {
        // Adjust index for insert
        result.push({ retain: typeof op2.insert === 'string' ? op2.insert.length : 1 });
        j++;
      } else {
        i++;
        j++;
      }
    }
    
    while (i < ops1.length) {
      result.push(ops1[i]);
      i++;
    }
    
    return { ops: result };
  }

  // Compose two operations
  compose(op1, op2) {
    const ops1 = op1.ops || [];
    const ops2 = op2.ops || [];
    const result = [];
    
    let i = 0, j = 0;
    
    while (i < ops1.length && j < ops2.length) {
      const operation1 = ops1[i];
      const operation2 = ops2[j];
      
      if (operation1.retain && operation2.retain) {
        const min = Math.min(operation1.retain, operation2.retain);
        result.push({ retain: min });
        if (operation1.retain > min) operation1.retain -= min;
        else i++;
        if (operation2.retain > min) operation2.retain -= min;
        else j++;
      } else if (operation1.insert && operation2.delete) {
        const len1 = typeof operation1.insert === 'string' ? 
          operation1.insert.length : 1;
        if (len1 > operation2.delete) {
          // Remove deleted portion from insert
          if (typeof operation1.insert === 'string') {
            operation1.insert = operation1.insert.slice(operation2.delete);
          }
          j++;
        } else {
          i++;
          operation2.delete -= len1;
          if (operation2.delete === 0) j++;
        }
      } else {
        result.push(operation1);
        i++;
      }
    }
    
    while (i < ops1.length) {
      result.push(ops1[i]);
      i++;
    }
    
    while (j < ops2.length) {
      result.push(ops2[j]);
      j++;
    }
    
    return { ops: result };
  }

  // Store operation for document
  storeOperation(documentId, operation) {
    if (!this.operations.has(documentId)) {
      this.operations.set(documentId, []);
    }
    this.operations.get(documentId).push({
      ...operation,
      timestamp: Date.now()
    });
  }

  // Get operations since version
  getOperationsSince(documentId, version) {
    const ops = this.operations.get(documentId) || [];
    return ops.slice(version);
  }
}

module.exports = new OTService();