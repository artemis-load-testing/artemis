const randomId = (len) => {
  return [...Array(len)]
    .map(() => Math.random().toString(36)[2])
    .join('')
    .toUpperCase();
};

module.exports = { randomId };
