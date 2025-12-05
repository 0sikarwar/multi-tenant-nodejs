function parseOracleError(err) {
  if (!err || !err.message || !err.message.startsWith("ORA-")) {
    return;
  }

  const originalMessage = err.message;

  if (originalMessage.includes("ORA-00001")) {
    err.message = "The record already exists. Please check your input and try again.";
  } else if (originalMessage.includes("ORA-01400")) {
    const columnMatch = originalMessage.match(/\."([^"]+)"\)/);
    if (columnMatch && columnMatch[1]) {
      err.message = `The field '${columnMatch[1].toLowerCase().replace(/_/g, " ")}' is required and cannot be empty.`;
    } else {
      err.message = "A required field is missing. Please fill out all fields.";
    }
  } else if (originalMessage.includes("ORA-02291")) {
    err.message = "Cannot create this record because a related required record does not exist.";
  } else if (originalMessage.includes("ORA-02292")) {
    err.message = "This record cannot be deleted because other records depend on it.";
  } else if (originalMessage.includes("ORA-01017")) {
    err.message = "Database connection failed due to invalid credentials.";
  }
}

module.exports = { parseOracleError };
