import bcrypt from 'bcrypt';

export async function comparePassword(plainPassword, hashedPassword) {
  // DB에 평문 남아있는 경우 임시 대응
  if (!hashedPassword.startsWith('$2b$')) {
    // 해시가 아니면 평문 비교로 통과시킴
    return plainPassword === hashedPassword;
  }
  return bcrypt.compare(plainPassword, hashedPassword);
}
