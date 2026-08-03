function appendClassValue(value, output) {
  if (!value) return;

  if (typeof value === "string") {
    output.push(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => appendClassValue(entry, output));
    return;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([className, enabled]) => {
      if (enabled) output.push(className);
    });
  }
}

export function tw(...values) {
  const output = [];
  values.forEach((value) => appendClassValue(value, output));
  return output.join(" ");
}
