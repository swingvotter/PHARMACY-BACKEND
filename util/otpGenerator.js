const randomNumberGenerator = () => {
  const randomNumber = Math.floor(100000 + Math.random() * 899999);
  return randomNumber;
};

module.exports = randomNumberGenerator;
