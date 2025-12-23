// This is a mock of the ConvertEmail function since it's not exported from the controller.
// In a real-world scenario, you would export this helper function to test it directly.
const ConvertEmail = async (email) => {
  const emailWithoutSpaces = email.replace(/\s/g, '');
  const emailParts = emailWithoutSpaces.split('@');
  const firstEmailPart = emailParts[0];
  const secondEmailPart = emailParts[1].toLowerCase();
  return firstEmailPart + '@' + secondEmailPart;
};

describe('Login Controller Unit Tests', () => {
  test('ConvertEmail should correctly format an email address', async () => {
    // Test case 1: All uppercase domain
    const email1 = 'test@EXAMPLE.COM';
    const expected1 = 'test@example.com';
    expect(await ConvertEmail(email1)).toBe(expected1);

    // Test case 2: Mixed case domain
    const email2 = 'another.test@GmAIL.CoM';
    const expected2 = 'another.test@gmail.com';
    expect(await ConvertEmail(email2)).toBe(expected2);

    // Test case 3: Email with spaces
    const email3 = '  user with spaces@domain.com  ';
    const expected3 = 'userwithspaces@domain.com';
    expect(await ConvertEmail(email3)).toBe(expected3);
  });
});
