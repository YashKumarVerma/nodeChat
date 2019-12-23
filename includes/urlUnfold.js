module.exports = {

    // this function returns true when passed string contains a url
    // https://stackoverflow.com/questions/10570286/check-if-string-contains-url-anywhere-in-string-using-javascript
    containsUrl : function(str){
        if(new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?").test(str)) {
            return true;    
        }
        else{
            return false;
        }
    },

    // extract links with https b/c google docs are usually
    getUrl:function(str){
        return str.match(/\bhttps?:\/\/\S+/gi);
    },

    // just a helper function taken from 
    // https://stackoverflow.com/questions/1058427/how-to-detect-if-a-variable-is-an-array
    isArray:function(obj){
        return toString.call(obj) === "[object Array]";
    }
};