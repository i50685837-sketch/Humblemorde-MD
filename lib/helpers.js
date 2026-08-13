function cleanPhoneNumber(phone) {

  if (!phone) return null;

  return String(phone)
    .replace(/\D/g, "");

}


function isValidPhoneNumber(phone) {

  if (!phone) return false;

  return (
    phone.length >= 10 &&
    phone.length <= 15
  );

}


function formatAmount(amount) {

  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "0.00";
  }

  return value.toFixed(2);

}


function sleep(ms) {

  return new Promise(
    resolve => setTimeout(resolve, ms)
  );

}


module.exports = {
  cleanPhoneNumber,
  isValidPhoneNumber,
  formatAmount,
  sleep
};
