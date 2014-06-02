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
- HerokuとWebSocket
  
---
### WebSocketアプリサンプル

---
### お絵描きツール
- [GitHub.ioにあるデモ](http://shunjikonishi.github.io/room-sandbox/sample/canvas.html)
- ひとつのCanvasに皆でお絵描き

<div>
  <div>
    <canvas id="pad2" height="200"></canvas> 
  </div>
  <div>
    <button id="btnClear" class="btn">Clear canvas</button>
  </div>
</div>

※スケールが変わっているためこの画面ではマウスの位置と描画がずれることがあります。
---
### Quizar
- http://quizar.info/
- ルーム内に出題者と回答者がいるクイズゲーム

<div id="quizar-video"></div>

---
### このプレゼン
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
シンプルに考えると以下のような感じ。。。

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

- ServerとServer'はほとんどの場合同じだが違う場合もある
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
Roomの右側と左側のメッセージを別に考えることができる

<div id="sender-src" style="display:none"> 
title: Sender
Client->Server:Message
Server->>Room:Publish
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
それぞれのメッセージ処理はHTTPで慣れ親しんだCall & Response型の処理とほとんど変わらない
</div>

---
### プロジェクト独自のタスク定義
- http://gruntjs.com/creating-tasks から引用

``` javascript
grunt.registerTask('foo', 'A sample task that logs stuff.', function(arg1, arg2) {
  if (arguments.length === 0) {
    grunt.log.writeln(this.name + ", no args");
  } else {
    grunt.log.writeln(this.name + ", " + arg1 + " " + arg2);
  }
});
```
- 実行コマンド  
  - 引数は「:」区切りで指定

``` bash
grunt foo
foo, no args

grunt foo:hoge:fuga
foo, hoge fuga
```
