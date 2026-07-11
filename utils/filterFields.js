const filterFields = function (obj, allowedFields) {
  const filtered = {};

  allowedFields.forEach((field) => {
    const value = obj[field];

    // Skip undefined, null, or blank strings
    if (
      value !== undefined &&
      value !== null &&
      !(typeof value === "string" && value.trim() === "")
    ) {
      filtered[field] = value;
    }
  });

  return filtered;
};

module.exports = filterFields;
