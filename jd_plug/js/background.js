let Domain = ''
// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	// console.log('收到来自content-script的消息：');
	// console.log(request, sender, sendResponse);
    if (request.domain) {
        Domain = request.domain
    }
    let str = '';
    if(request.account){
       str = request.account;
        window.localStorage.setItem('account',request.account)
    }
    if(request.sendStart){
        str = '插件正常运行中';
    }
    if(request.break){
        str = '插件：请输入手机号登录，或重试';
    }

    sendResponse(str);
});

function GetCookie(){
    return new Promise(resolve => {
        chrome.cookies.getAll({},function(cookie){
            let arr = [];
            cookie.forEach(item => {
              console.log(item);
              if(Domain.indexOf(item.domain) !== -1){
                let str = item.name+'='+item.value;
                arr.push(str)
              }
            });
            let cookieStr = arr.join(';');
            resolve(cookieStr);
        });
    })

}
// get 请求
function getRequest(data) {
    return new Promise((resolve, reject) => {
//      本地 http://127.0.0.1:18083/PinDuoDuoCookieInterface
        $.get('http://192.168.20.147:18083/PinDuoDuoCookieInterface', data, function (params) {
            resolve(params);
        }).error(function (err) {
            reject(err)
        })
    })
}
// post
function postRequest(data) {
    return new Promise((resolve, reject) => {
        $.post('http://192.168.20.147:18083/PinDuoDuoCookieInterface',JSON.stringify(data),function (params) {
            resolve(params);
        }).error(function (err) {
            reject(err)
        })
    })
}

function _showDataOnPage(data){
    let close_time = 3000;
    //显示一个桌面通知
    if(window.webkitNotifications){
        var notification = window.webkitNotifications.createNotification(
            'img/icon.png',  // icon url - can be relative
            '京东请求cookie返回',  // notification title
            data,  // notification body text
            'requireInteraction' //手动关闭
        );
        notification.show();
        // 设置3秒后，将桌面通知dismiss
        setTimeout(function(){notification.cancel();}, close_time);

    }else if(chrome.notifications){
        var opt = {
            type: 'basic',
            title: '京东请求cookie返回',
            message: data,
            iconUrl: 'img/icon.png',
            // buttons: [{title:'点击此按钮直接去登录'}],
            requireInteraction: true //手动关闭
        }
        chrome.notifications.create('', opt, function(id){
            setTimeout(function(){
                chrome.notifications.clear(id, function(){});
            }, close_time);
        });

        // chrome.notifications.onButtonClicked.addListener((notificationId,index)=>{
        //
        //     console.log(notificationId,index); //当前通知的ID和当前点击按钮的index
        // });
    }else{
        alert(data);
    }

}
// 判断是否是手机号
function isPhone(val) {
    if(val){
        let reg = /^1[1-9]\d{9}$/;
        return reg.test(val)
    }
    return  val
}


// 后台popup
function testBackground() {
    let obj = {};
    obj.phone = window.localStorage.getItem('account');
    console.log(obj);
    return obj;
}

// 发送请求
function sendRequest() {
    GetCookie()
        .then(res=>{

            // 请服务器发送账号和淘宝cookie
            let formData = {
              pddAccount:'',
              pddCookie: res,
              pddAccountType: 'ordinary'
            };
            // 获取获取到是京东页面之后再发送请求
            formData.pddAccount = window.localStorage.getItem('account')

            console.log(formData);
            console.log(new Date());

            postRequest(formData)
                .then(res=>{
                    console.log(res);
                    _showDataOnPage(res)
                })
                .catch(err=>{
                  _showDataOnPage('请求异常')
                    console.log(err);
                })
        })
}
