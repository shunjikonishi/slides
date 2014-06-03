###Herokuで作る<br>WebSocketアプリケーション
2014年6月9日  
株式会社 FLECT  
小西俊司
---
### Who?
- 氏名: 小西俊司
- 所属： [株式会社 FLECT](http://www.flect.co.jp/) クラウド事業部
  - [OSS Library](http://oss.flect.co.jp/)
- Twitter: [@shunjikonishi](https://twitter.com/shunjikonishi)
- GitHub: [shunjikonishi](https://github.com/shunjikonishi)

---
### Agenda
- WebSocketアプリサンプル
- WebSocketの通信パターン
- WebSocketとセキュリティ
- 切断のパターンと対処
  
---
### WebSocketアプリサンプル

---
### [お絵描きツール](http://shunjikonishi.github.io/room-sandbox/sample/canvas.html)
- ひとつのCanvasに皆でお絵描き
- MouseMoveでメッセージ送信
  - メッセージの連投に強いことがわかる

<div>
  <div>
    <canvas id="pad2" height="200"></canvas> 
  </div>
  <div>
    <button id="btnClear" class="btn">Clear canvas</button>
  </div>
</div>

> ※スケールが変わるためこの画面ではマウスの位置と描画がずれることがあります。

---
### Quizar
- http://quizar.info/
- ルーム内に出題者と回答者がいるクイズゲーム

<div id="quizar-video"></div>

---
### このプレゼン
- [REVEAL.js](http://lab.hakim.se/reveal-js/)と[remotes.io](http://remotes.io/)のコンボ
- Sender: スマホ。 スワイプ等のイベントを送信
- Receiver: PC。 イベントに反応してページをめくる

<img src="images/reveal.png" style="width: 600px;height:400px;"/>

---
### ルームモデル
- WebSocketアプリの典型的なモデル
- 同じ部屋に複数のクライアントが存在して何らかのコラボレーションを行うモデル
- 各クライアントのロールは同じとは限らない

<img src="images/roommodel.png" style="width: 600px;height:400px;"/>

---
### WebSocket通信のパターン

---
### 例題
ロールが複数あるアプリのメッセージを考える

- クイズアプリで、
- 出題者、回答者、観覧者がいる状態で、
- 出題者が送信したメッセージを、
- 回答者が受信する

<div class="padTop">
シーケンスを図示せよ
</div>

---
### 解答例
素直に書くと以下のような感じ。。。

<div id="simple-src" style="display:none"> 
participant 出題者
participant Server
participant 回答者
participant 観覧者
出題者->Server:Message
Server->回答者:Message
</div> 
<div id="simple" class="sequence"> 
</div> 
<div class="padTop">
間違ってないが。。。
</div>

---
### 常に間にルームを置いて考える

<div id="room-src" style="display:none"> 
participant 出題者
participant Server
participant Room
participant Server'
participant 回答者
participant 観覧者
participant 出題者'
出題者->Server:Message
Server->>Room:Publish
Room->>Server':Broadcast
Server'->回答者:Message
</div> 
<div id="room" class="sequence"> 
</div>

- Roomは単純なメッセージブロードキャスト機構
- Serverが単一ホストの場合でも常にルームを介してブロードキャストする
- 送信元の出題者と出題者は同じクライアントだが別のエンティティとして考える

*このように考えることには2つのメリットがある*

---
### メリット1: スケールアウト
- 接続数が増えた場合にサーバ台数を増やすことで対応可能となる
  - Herokuの場合はDyno数を増やすだけ
- Room機能はRedisのPub/Subをそのまま利用できる
- 逆にRoom概念が導入されていない場合に後からスケールアウトすることはほとんど不可能

---
### メリット2: シンプル
Roomの右側と左側のシーケンスを別に考えることができる

<div id="sender-src" style="display:none"> 
title: Sender
Client->Server:Message
Server->Room:Publish
Server-->Client: or Response
</div> 
<div id="receiver-src" style="display:none"> 
title: Receiver
Room->Server:Broadcast
Server->Client:Message
Note over Server:or Dispose
</div> 
<div>
  <div id="sender" class="sequence" style="display:inline-block;"> 
  </div>
  <div id="receiver" class="sequence" style="display:inline-block;"> 
  </div>
</div>

<div class="padTop">
</div>

- ロールが増えても常にシーケンスは上記のパターンのみ
- それぞれのメッセージ処理はHTTPで慣れ親しんだCall & Response型の処理とほぼ同じ

---
### Ajaxの代替としてのWebSocket
- デメリット
  - WebSocketの送受信メッセージには対応関係がないのでメッセージ内にIDを埋め込んで自分で対応関係を管理する必要がある
  - WebSocket非対応端末がある(IE9以前、Android 4.3以前の標準ブラウザ)
- メリット
  - 高速
  - ステートを維持した連続リクエストが可能(Ex. インクリメンタルサーチ)
  - *セキュリティ上のメリット*

---
### WebSocketとセキュリティ

---
### 一般的なお話
- WebSocketには*Same Origin Policyがない*ためどこからでも繋がる
  - 接続時にOriginヘッダを検証すべき
- WebSocketリクエストにはCookieが付加される
  - Cookieのみを頼りにしたクライアント確認はCSRFと同じ原理の攻撃が可能(CSWSH)
- 通信内容を保護したい場合はwssを使用する

---
### 閑話休題
WebSocketとXSSのコンボはやばすぎる

``` JavaScript
var ws = new WebSocket("ws://...");
ws.onmessage = function(event){
  eval(event.data);//外部からajax通信を含む任意のスクリプトが実行できる
}
$.ajax = function(v) { //正規の通信を行いつつwsに通信内容を横流し}
```

XSS脆弱性はそもそも存在してはならないが、  
WebSocketがあることでリスク激増！

---
### 安全な接続の確立方法
考え方はCSRF対策と同じ

- ws接続を行うHTMLページを返す際にトークンを生成
  - CookieにSessionIdを付与する
  - トークンはSessionIdとひもづけてMemcached等に保存
- ws接続確立時(onopenイベント)でトークンを送信
  - サーバ側でSessionIdとトークンを検証
  - 成功時のレスポンスでは新たに生成したトークンを返す
- なんらかの理由で切断があって再接続した場合も同様にonopenでトークンを送信

---
### トークン検証のシーケンス

<img src="images/token.svg" style="background-color:#fff;">

---
### WebSocket vs. REST
``` javascript
$(document).ready(function() {
  var ws = new WebSocket("wss://...");
  //トークン検証後に任意の処理を記述
  ...
});
```

- WebSocketは通常クロージャの中で生成されるためそのインスタンスにはクロージャ外部からはアクセスできない
  - 仮にXSSの脆弱性があったとしても既存のインスタンスにはアクセスできない
  - トークンは検証毎に置き換えるので新たな接続を確立することもできない
  - ということは*検証後のリクエストは常にValid*
- 対してREST APIは常にオープン
  - ステートレスであるがゆえの宿命
  - リクエスト毎の検証が必須

---
### WebSocket APIでのセキュリティチェック
- セッションの検証
  - 接続時に検証すればその後は不要
- パラメータの検証
  - クライアント側でチェックしていれば不要
  - ただしクライアント側にバグがある可能性を考慮して行うべき
- CSRFチェック
  - もちろん不要

> REST APIがpublicメソッドなのに対し、privateメソッドのイメージ

---
### 切断のパターンとその対処

---
### HerokuとWebSocket
``` bash
heroku labs:enable websockets -a xxxx
```

- WebSocketを使うためにはlabsコマンドで有効化が必要
- 1日に1度以上Dyno再起動があるのでそのタイミングで接続していたクライアントは切れる
- 接続確立後も無通信状態が55秒続くと切れる
- デプロイや環境変数の変更でもDynoが再起動して切れる
- Herokuの良いところはスケールアウトに対応しやすいところ

安定した接続を要求するアプリの場合はHerokuは向かない

---
### クライアント側の切断要因
- ブラウザ(タブ)を閉じる
- 携帯端末のスリープ
- スマホで長時間ブラウザをインアクティブにする
- 通信環境不良／WiFiからの切断
- 一方でAndroid Chromeのようにスリープしてもずっと切断されない端末もある

<div class="padTop"></div>

携帯端末をターゲットに含めるなら安定した接続を期待することはできない

---
### デプロイ
- 近年アプリのリリース頻度は日に数回というレベルまである位に増える傾向
- よっぽど人気のないアプリでもない限りリリース時に接続ユーザがいないという状況は期待できない

<div class="padTop"></div>

結局のところ*不測の切断に対する考慮はすべてのWebSocketアプリで必要*

> まったく別の議論としてリリースサイクルを変えるためにWebSocketサーバとHttpサーバを分離するという選択はありえる

---
### 基本戦略
- 切断されたら再接続
  - WebSocket#oncloseイベントで再接続
  - 時間をおいて数回リトライする
  - 接続確立後はトークンを検証する

---
### 無通信回避のためのポーリング
サーバからとクライアントからのどちらで行うべきか？

<div class="padTop">
  <p>実験: setIntervalで100ms毎に処理を実行</p>
  <hr>
  <table>
    <tr><td>実行回数</td><td> - </td><td id="cntTimer" style="width:100px;"></td></tr>
    <tr><td>経過時間</td><td> - </td><td id="timeTimer" style="width:100px;"></td></tr>
  </table>
  <button id="resetTimer" class="btn">リセット</button>
</div>

---
### ブラウザのsetTimeout(setInterval)
- 指定の時間に起動するというものではない
- ブラウザのタブがバックグラウンドに回るだけで後回しにされる
- Androidはバックグラウンドでの実行遅延が特に顕著
- iOSはバックグラウンドではそもそもイベントが発生しない

クライアントからポーリングしても無通信回避できるかどうかはかなり怪しい。。。

---
### サーバーからポーリングした場合
- PCブラウザはメッセージ着信時にただちにイベント処理される
- iOSはバックグラウンド時はイベントが発生せずキューにためられる
  - アクティブになった時にまとめてイベントが発生する
  - 切断時のWebSocket#oncloseイベントの発生もこのタイミング
  - キューがあふれた場合にどうなるかは定かではないが多分その前に接続が切れる
- Androidはスリープしててもイベントを延々と処理し続ける

困る

---
### [PageVisibility API](https://developer.mozilla.org/ja/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API)
- ブラウザがアクティブであるかどうかは*document#hidden*で判定できる
- ブラウザのアクティブ状態変更イベントは*document#visibilitychange*イベントでフックできる
  - iOSの場合はvisibilitychangeが発生しないのでwindow#pageshow/pagehideで代替
- アクティブ状態によって処理を切り替えることは可能
  - iOSは非アクティブの場合、何のイベントも発生しないので除外
- アクティブ化した時に接続状態をチェックして再接続することも可能
  - ただしトークン(またはCookieに保存したSessionId)がタイムアウトしている可能性はある

なんとなく使えそうな気はする

---
### ポーリング問題の結論
- やらないのが一番いい
- もしやるのであれば
  - 対象がPCブラウザの場合はサーバーからポーリング
  - 対象がスマホの場合はアクティブ時のみクライアントからポーリング

さらなるベストプラクティスを見つけたい人は[ここ]()でブラウザの挙動をチェックしよう

---
### まとめ
- WebSocketは使い方によっては今までにないアプリを作れる可能性があります。
- WebSocketを扱うためのインフラは既に十分に整っています。
- しかしWebSocketプログラミングのためのノウハウ、デザインパターン、フレームワークなどはまだまだ未整備です。
- Ajaxの代替としてWebSocketを使うのはアリです。

そして今日説明したような内容を*なんとなくいい感じに*処理してくれるフレームワークが[ここ]()にあります。

---
### 参考資料
- [WebSocketのバイナリメッセージを試したら、ウェブの未来が垣間見えた](http://blog.agektmr.com/2012/03/websocket.html)
- [Webアプリ開発者のためのHTML5セキュリティ入門](http://www.slideshare.net/muneakinishimura/webhtml5-31749532)
- [Cross-Site WebSocket Hijacking](http://www.christian-schneider.net/CrossSiteWebSocketHijacking.html)
