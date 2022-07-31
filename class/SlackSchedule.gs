function test_SlackSchedule() {
  const slackSchedule = new SlackSchedule()

  const channel = "C03R70A7K9C", postAt = new Date("2022/07/31  23:50:00"), text = "testMsg"
  for (let cnt = 0; cnt < 5; cnt++) {
    const resObj = slackSchedule.postScheduleMessage(channel, postAt, text)
    console.log(resObj)
  }

  const list = slackSchedule.getScheduleMessageList()
  const msgid = list[0].id
  const del = slackSchedule.deleteScheduleMessage(channel, msgid)
  const deleteResultList = slackSchedule.deleteScheduleMessageAll(channel)

  console.log(list)
  console.log(del)
  console.log(deleteResultList)

}


class SlackSchedule {
  /**
   * 
   */
  /**
   * slack API に関するコンストラクタ
   * @constructor
   */
  constructor() {
    /** @type {string} */
    //this.token = PropertiesService.getScriptProperties().getProperty('USER_OAUTH_TOKEN');
    this.token = PropertiesService.getScriptProperties().getProperty('BOT_USER_OAUTH_TOKEN');
    /** @type {string} */
    //this.botToken = PropertiesService.getScriptProperties().getProperty('BOT_USER_OAUTH_TOKEN');

  }

  /**
   * fetch メソッド用のパラメーターを生成するメソッド
   * @param {string} method - GET or POST メソッド。デフォルト引数は「POST」
   * @param {string} token - 利用するトークン。デフォルト引数は this.token
   * @return {Object} fetch メソッド用のパラメーター
   */
  getParams(method = 'POST', token = this.token) {
    const params = {
      method: method,
      headers: {
        Authorization: 'Bearer ' + token
      }
    };
    return params;
  }
  /**
   * fetch メソッド用のパラメーターを生成するメソッド。payloadを利用する場合。
   * @param {string} method - GET or POST メソッド。デフォルト引数は「POST」
   * @param {string} payload - デフォルト引数は ""
   * @return {Object} fetch メソッド用のパラメーター
   */
  getParamAddPayload(method = 'POST', payload = "") {
    const params = {
      method: method,
      contentType: "application/x-www-form-urlencoded",
      payload: payload
    };
    return params;
  }

  /**
   * UrlFetchApp を利用して取得した値をオブジェクト化して返す関数
   * @param {string} url - fetch メソッド用の URL
   * @param {Object} params - fetch メソッド用のパラメーター
   */
  getAsObject(url, params) {
    const response = UrlFetchApp.fetch(url, params);
    const json = response.getContentText();
    const object = JSON.parse(json);
    return object;
  }

  /**
   * 予約する｡
   * APIドキュメント : https://api.slack.com/methods/chat.scheduleMessage
   * 
   * @param {string} channel - channelのId
   * @param {Data} postAt - post_at 送信する時間 
   * @param {string} text - 送信するメッセージ
   * @return {pbject}
   */
  postScheduleMessage(channel, postAt, text) {

    const url = "https://slack.com/api/chat.scheduleMessage";
    const payload = {
      "post_at": this.getUnixTime_(postAt),
      "token": this.token,
      "channel": channel,
      "text": text,
    };

    const params = this.getParamAddPayload("POST", payload)

    return this.getAsObject(url, params)
  }

  /**
   * 予約を一つ削除する｡
   * APIドキュメント : https://api.slack.com/methods/chat.deleteScheduledMessage
   * 
   * @param {string} channel - channelのId
   * @param {string} scheduledMessageId - scheduledMessageId
   * @return {pbject}
   */
  deleteScheduleMessage(channel, scheduledMessageId) {

    const url = "https://slack.com/api/chat.deleteScheduledMessage";
    const payload = {
      "token": this.token,
      "channel": channel,
      "scheduled_message_id": scheduledMessageId,
    };

    const params = this.getParamAddPayload("POST", payload)

    return this.getAsObject(url, params)
  }

  /**
   * 対象チャンネルの予約をすべて削除する｡
   * APIドキュメント : https://api.slack.com/methods/chat.deleteScheduledMessage
   * 
   * @param {string} channel - channelのId
   * @return {pbject}
   */
  deleteScheduleMessageAll(channel) {
    this.scheduleMessageList_ = undefined
    const scheduleMessageList = this.getScheduleMessageList()
    const deleteResultList = scheduleMessageList.flatMap(record => {
      if (record.channel_id === channel) {
        const deleteResult = this.deleteScheduleMessage(channel, record.id)

        return deleteResult
      } else {
        return []
      }
      console.log(record)
    })
    return deleteResultList
  }

  /**
   * 予約リストを取得する｡
   * APIドキュメント : https://api.slack.com/methods/chat.scheduledMessages.list
   * 
   * @param {string} cursor - デフォルトは ""
   * @return {object} scheduleMessageList - scheduleMessageList
   */
  getScheduleMessageList(cursor = "") {

    const url = "https://slack.com/api/chat.scheduledMessages.list";
    const payload = {
      "limit": "3",
      "cursor": cursor,
      "token": this.token,
    };

    const params = this.getParamAddPayload("GET", payload)
    const resObject = this.getAsObject(url, params)

    this.scheduleMessageList_ = this.scheduleMessageList_ === undefined ? resObject.scheduled_messages : this.scheduleMessageList_.concat(resObject.scheduled_messages);

    this.nextCorsor = resObject.response_metadata.next_cursor;
    if (this.nextCorsor !== '') return this.getScheduleMessageList(this.nextCorsor);
    const scheduleMessageList = this.scheduleMessageList_;
    this.scheduleMessageList_ = undefined ; //リセットしないと次回の取得がおかしくなるので削除する
    return scheduleMessageList;

  }

  /**
   * unixTime に変換するメソッド
   * @param {Date} - date
   * @return {number} - unixTime
   */
  getUnixTime_(date) {
    const formatNow = Utilities.formatDate(date, 'GMT', 'dd MMM yyyy HH:mm:ss z')
    const unixTime = Date.parse(formatNow) / 1000
    return unixTime.toString()
  }

}














