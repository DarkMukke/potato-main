module.exports = {
    apps : [{
        name   : "potato",
        script : "./index.js",
        watch  : true,
        ignore_watch : ["[\/\\]\./", "node_modules"],
        time : true,
        log_date_format : "YYYY-MM-DD HH:mm Z"
    }]
}