var errorHandler = {
    catchErrors: function (code, callback) {
        try {
            code();
        } catch (error) {
            if (callback) {
                callback(error);
            } else {
                this.handleErrors(error);
            }
        }
    },
    handleErrors: function (error) {
        console.log(error)
    }
}