import crypto from "crypto";

const randomChar = (chars: string) => {
  return chars[crypto.randomInt(0, chars.length)];
};

export const generateTemporaryPassword = (length = 12) => {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "@#$%&*";

  const all = lower + upper + numbers + symbols;

  const passwordChars = [
    randomChar(lower),
    randomChar(upper),
    randomChar(numbers),
    randomChar(symbols),
  ];

  while (passwordChars.length < length) {
    passwordChars.push(randomChar(all));
  }

  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join("");
};