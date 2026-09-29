// Generate unique ID
exports.generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Deep clone
exports.deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// Throttle function
exports.throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Debounce function
exports.debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Transform position based on operation
exports.transformPosition = (pos, operation) => {
  let newPos = pos;
  let index = 0;
  
  for (const op of operation.ops) {
    if (op.retain) {
      if (pos < index + op.retain) {
        return newPos;
      }
      index += op.retain;
      newPos += op.retain;
    } else if (op.insert) {
      if (pos <= index) {
        newPos += typeof op.insert === 'string' ? op.insert.length : 1;
      }
    } else if (op.delete) {
      if (pos > index && pos <= index + op.delete) {
        return index;
      }
      if (pos > index + op.delete) {
        newPos -= op.delete;
      }
      index += op.delete;
    }
  }
  
  return newPos;
};

// Check if operation is valid
exports.isValidOperation = (op) => {
  if (!op || typeof op !== 'object') return false;
  if (!Array.isArray(op.ops)) return false;
  
  return op.ops.every(operation => {
    const keys = Object.keys(operation);
    if (keys.length !== 1) return false;
    const key = keys[0];
    return ['insert', 'delete', 'retain'].includes(key);
  });
};