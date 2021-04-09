const jsonParser = (data, message) => {
  //   let key = Object.keys(data)[0];
  if (!data) {
    return {
      header: {
        error: 1,
        message,
      },
    };
  } else if (Array.isArray(data)) {
    if (data.length !== 0) {
      return {
        header: {
          error: 0,
          message: message,
        },
        body: {
          data,
        },
      };
    } else {
      return {
        header: {
          error: 0,
          message: message,
        },
      };
    }
  } else {
    return {
      header: {
        error: 0,
        message: message,
      },
      body: {
        data,
      },
    };
  }
};

module.exports = jsonParser;
