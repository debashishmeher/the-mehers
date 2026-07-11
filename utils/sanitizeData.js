exports.sanitizeUpdateFields = (body, disallowedFields) => {
  const sanitized = { ...body };
  disallowedFields.forEach(field => delete sanitized[field]);
  return sanitized;
};


exports.sanitize = (data, allowedFields = []) => {
  const sanitized = {};

  Object.keys(data).forEach((key) => {
    if (allowedFields.length && !allowedFields.includes(key)) return;

    let value = data[key];

    if (value === undefined || value === null) return;

    if (typeof value === "string") {
      value = value.trim();
    }

    sanitized[key] = value;
  });

  return sanitized;
};
