export const formatResponse = (data: any, message = 'Success') => {
    return {
      status: 'success',
      message,
      data
    };
  };