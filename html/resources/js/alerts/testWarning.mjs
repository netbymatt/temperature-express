// test for any active warnings
const testWarning = (categorized) => Object.values(categorized).some((type) => (type.some((alert) => !!(alert.isWarning && alert.isActive))));

export default testWarning;
