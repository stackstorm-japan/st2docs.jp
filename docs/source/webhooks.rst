Webhooks
========

Webhook を通じて、ユーザは様々な外部システムを |st2| に統合することができます。センサのようにイベント情報をこちらから取得しに行く形態（pull 型）とは異なり、Webhook では外部システムが直接 |st2| API のエンドポイントに対して HTTP POST リクエストを送ってイベント情報を通知する形態 (push 型) になります。

Sensors vs Webhooks
-------------------

センサが外部システムと連携する際は、センサが定期的に外部システムに対して接続し情報を取得する処理) をするか、センサがユーザ定義のポート・プロトコルでのリクエストを待つかのどちらかの方法で行います。

Webhook は後者に大別され、JSON か URL エンコーディングされたデータを HTTP POST リクエストから受け取ります。外部システムで何からのイベントが発生した際は、当該システムが |st2| に対してデータを送ります。

センサを使うことで、より細かい粒度でかつ厳格なシステム連携ができます。

一方、Webhook によってより簡単にシステム連携できるようになります。例えば、特定のシステムと連携するスクリプトやソフトウェアがある場合、リクエストの送信先を |st2| の API に変えるだけで、簡単に |st2| によるイベントハンドリングを行えます。

また GitHub など既に Webhook 機能を提供しているサードパーティ製システムと連携が容易である点でも Webhook は有用です。

認証(Authentication)
--------------------

Webhook のエンドポイント ``/api/v1/webhooks`` に対する全てのリクエストは API へのリクエストと同様、認証を経る必要があります。認証の方法は :ref:`API キー<authentication-apikeys>` とトークンの２つあります。Webhook では API キーを推奨します（トークンと違い、有効期限が無いため）。

API キーによる認証
~~~~~~~~~~~~~~~~~~

* `ヘッダ` : ``St2-Api-Key``
* `クエリパラメータ` : ``?st2-api-key``

トークンによる認証
~~~~~~~~~~~~~~~~~~

* `ヘッダ` : ``X-Auth-Token``
* `クエリパラメータ` : ``?x-auth-token``


上記の２種類の方法ともにヘッダもしくはクエリパラメータによる認証をサポートしています。ヘッダによる認証はリクエストヘッダを自由に変更できるユーザスクリプトで主に用いられ、クエリパラメータは GitHub などの Webhook エンドポイントの URL しか渡せないようなサードパーティシステムから認証を行う際に利用できます。

リクエストボディ
----------------

トリガのペイロードとなるリクエストボディは、JSON 形式もしくは URL エンコードされたデータのどちらでも受けられます。リクエストボディのデータタイプは ``Content-Type`` ヘッダによって決まります。当該ヘッダに ``application/json`` が指定されれば JSON と解釈し ``application/x-www-form-urlencoded`` が指定されれば、URL エンコードされたデータとして処理します。

以降で示す例では、JSON 形式でデータを受け取った場合（``Content-Type`` ヘッダに ``application/json`` を指定した場合）を想定しています。

Webhook の登録
--------------

|st2| に Webhook を登録するには、ルール定義中にトリガ ``core.st2.webhook`` を指定することでできます。

以下は Webhook ``sample`` を登録するルール定義ファイルになります。

.. sourcecode:: yaml

    ...
    trigger:
            type: "core.st2.webhook"
            parameters:
                url: "sample"
    ...

ファイル中の ``url`` パラメータで指定した値が ``/api/v1/webhooks/`` をプレフィックスに持つ HTTP POST リクエストを受け付けるエンドポイントの URL になります。上記ルールファイルを登録することで、``https://{$ST2_IP}/api/v1/webhooks/sample`` に対する HTTP POST リクエストをハンドリングできるようになります。

リクエストボディは、JSON 形式の任意の値を受け取ることができ、ルールにおいて `criteria`` パラメータでマッチする条件を指定することもできます。

なお ```url`` パラメータで指定された値の先頭と末尾の ``/`` は無視されます。なので ``/sample``, ``sample/``, ``/sample`` のいづれを指定した場合も ``sample`` として解釈され ``/api/v1/webhooks/sample`` と登録されます。

作成した Webhook に対して HTTP POST リクエストを送ると、リクエスト情報が以下の変数に設定されます。

+-----------------+------------------------+--------------+
| **変数名**      | **内容**               | **データ型** |
+-----------------+------------------------+--------------+
| trigger         | トリガ名               | string       |
+-----------------+------------------------+--------------+
| trigger.headers | HTTP ヘッダの情報      | dict         |
+-----------------+------------------------+--------------+
| trigger.body    | リクエストボディの情報 | dict         |
+-----------------+------------------------+--------------+

以下は ``curl`` からユーザ定義の Webhook に対してリクエストを送り、これをハンドリングするための ``criteria`` を設定する方法を示した例になります。

.. sourcecode:: bash

    curl -X POST https://localhost/api/v1/webhooks/sample -H "X-Auth-Token: matoken" -H "Content-Type: application/json" --data '{"key1": "value1"}'

ルール定義ファイル:

.. sourcecode:: yaml

    ...
    trigger:
            type: "core.st2.webhook"
            parameters:
                url: "sample"

    criteria:
        trigger.body.key1:
            type: "equals"
            pattern: "value1"

    action:
        ref: "mypack.myaction"
        parameters:
    ...

Generic Webhook の使用
----------------------

|st2| では ``st2`` という名前の webhook (generic webhook) がデフォルトで登録されており、当該 Webhook へ POST リクエストを送ることで、ユーザは ``core.st2.webhook`` を定義しなくても |st2| に登録されている任意のトリガをディスパッチすることが出来ます。これによって、明示的に Webhook を定義していないルールを発動させることができます。

generic webhook のリクエストボディには、以下の JSON 形式で値を必ず設定しないといけません。

* ``trigger`` - トリガ名 (e.g. ``mypack.mytrigger``)
* ``payload`` - トリガに渡すのペイロードデータ

以下は curl から generic webhook に対するリクエスト送信と、当該リクエストにマッチするルール定義ファイルの例です。``localhost`` の部分は、|st2| ノードのホスト名に適宜置き換えて実行してください。

.. sourcecode:: bash

    curl -X POST https://localhost/api/v1/webhooks/st2 -H "X-Auth-Token: matoken" -H "Content-Type: application/json" --data '{"trigger": "mypack.mytrigger", "payload": {"attribute1": "value1"}}'

ルール定義ファイル:

.. sourcecode:: yaml

    ...
    trigger:
        type: "mypack.mytrigger"

    criteria:
        trigger.attribute1:
            type: "equals"
            pattern: "value1"

    action:
        ref: "mypack.myaction"
        parameters:
    ...

ルール定義ファイルの ``trigger.type`` の値は、リクエストボディの ``trigger`` パラメータで指定する値と同じにする必要があります。

登録済み Webhook の一覧表示
---------------------------

登録済みの Webhook の一覧を表示するには以下を実行します。

.. code-block:: bash

    st2 webhook list

Webhook がうまく動かない場合
----------------------------

もし、登録した webhook が |st2| にうまく認識されなかったり、期待通りにトリガがディスパッチされない場合、まずは :doc:`Webhooks のトラブルシュート</troubleshooting/webhooks>` をご確認ください。

Webhook を使わない場合
----------------------

Webhook はとても便利ですが、以下の欠点もあります。

* **非双方向性** - Webhook は単純にデータを |st2| に送るだけなので、リクエストによって実行されたアクションの execution ID などのデータを |st2| から取得するといったことができません（別の非同期的なやり方が必要）。
* **非実行保証** - |st2| は Webhook リクエストに対するアクション・ワークフローの実行を保証しません。これらの実行はルールの設定に依存し、リクエストボディに応じて、アクションが実行されない（もしくは複数のアクションが実行される）可能性があります。

もし確実にアクション・ワークフローを実行し、かつ実行に関する情報を取得したい場合は ``/v1/executinos`` API を利用します。これは ``st2 run <mypack>.<myaction>`` のようにアクションを明示的に実行した場合と同じです。
``--debug`` オプションによって、このコマンドの裏側で実行される処理を確認できます。

.. sourcecode:: bash

    st2 --debug run core.local "date"
    2017-03-31 08:21:18,706  DEBUG - Using cached token from file "/home/ubuntu/.st2/token-st2admin"
    # -------- begin 140183979680208 request ----------
    curl -X GET -H  'Connection: keep-alive' -H  'Accept-Encoding: gzip, deflate' -H  'Accept: */*' -H  'User-Agent: python-requests/2.11.1' -H  'X-Auth-Token: da5ecf3b0ab841008d663052fe95cddd' http://127.0.0.1:9101/v1/actions/core.local
    # -------- begin 140183979680208 response ----------
    {"name": "local", "parameters": {"cmd": {"required": true, "type": "string", "description": "Arbitrary Linux command to be executed on the local host."}, "sudo": {"immutable": true}}, "tags": [], "description": "Action that executes an arbitrary Linux command on the localhost.", "enabled": true, "entry_point": "", "notify": {}, "uid": "action:core:local", "pack": "core", "ref": "core.local", "id": "58c9663a49d4af4cbd56f84d", "runner_type": "local-shell-cmd"}
    # -------- end 140183979680208 response ------------

    # -------- begin 140183979680080 request ----------
    curl -X GET -H  'Connection: keep-alive' -H  'Accept-Encoding: gzip, deflate' -H  'Accept: */*' -H  'User-Agent: python-requests/2.11.1' -H  'X-Auth-Token: da5ecf3b0ab841008d663052fe95cddd' 'http://127.0.0.1:9101/v1/runnertypes/?name=local-shell-cmd'
    # -------- begin 140183979680080 response ----------
    [{"runner_module": "local_runner", "uid": "runner_type:local-shell-cmd", "description": "A runner to execute local actions as a fixed user.", "enabled": true, "runner_parameters": {"sudo": {"default": false, "type": "boolean", "description": "The command will be executed with sudo."}, "timeout": {"default": 60, "type": "integer", "description": "Action timeout in seconds. Action will get killed if it doesn't finish in timeout seconds."}, "cmd": {"type": "string", "description": "Arbitrary Linux command to be executed on the host."}, "kwarg_op": {"default": "--", "type": "string", "description": "Operator to use in front of keyword args i.e. \"--\" or \"-\"."}, "env": {"type": "object", "description": "Environment variables which will be available to the command(e.g. key1=val1,key2=val2)"}, "cwd": {"type": "string", "description": "Working directory where the command will be executed in"}}, "id": "58c9663a49d4af4cbd56f847", "name": "local-shell-cmd"}]
    # -------- end 140183979680080 response ------------

    # -------- begin 140183979680976 request ----------
    curl -X POST -H  'Connection: keep-alive' -H  'Accept-Encoding: gzip, deflate' -H  'Accept: */*' -H  'User-Agent: python-requests/2.11.1' -H  'content-type: application/json' -H  'X-Auth-Token: da5ecf3b0ab841008d663052fe95cddd' -H  'Content-Length: 69' --data-binary '{"action": "core.local", "user": null, "parameters": {"cmd": "date"}}' http://127.0.0.1:9101/v1/executions
    # -------- begin 140183979680976 response ----------
    {"status": "requested", "start_timestamp": "2017-03-31T08:21:18.828620Z", "log": [{"status": "requested", "timestamp": "2017-03-31T08:21:18.843043Z"}], "parameters": {"cmd": "date"}, "runner": {"runner_module": "local_runner", "uid": "runner_type:local-shell-cmd", "description": "A runner to execute local actions as a fixed user.", "enabled": true, "runner_parameters": {"sudo": {"default": false, "type": "boolean", "description": "The command will be executed with sudo."}, "timeout": {"default": 60, "type": "integer", "description": "Action timeout in seconds. Action will get killed if it doesn't finish in timeout seconds."}, "cmd": {"type": "string", "description": "Arbitrary Linux command to be executed on the host."}, "kwarg_op": {"default": "--", "type": "string", "description": "Operator to use in front of keyword args i.e. \"--\" or \"-\"."}, "env": {"type": "object", "description": "Environment variables which will be available to the command(e.g. key1=val1,key2=val2)"}, "cwd": {"type": "string", "description": "Working directory where the command will be executed in"}}, "id": "58c9663a49d4af4cbd56f847", "name": "local-shell-cmd"}, "web_url": "https://st2expect/#/history/58de117e49d4af083399181c/general", "context": {"user": "st2admin"}, "action": {"description": "Action that executes an arbitrary Linux command on the localhost.", "runner_type": "local-shell-cmd", "tags": [], "enabled": true, "pack": "core", "entry_point": "", "notify": {}, "uid": "action:core:local", "parameters": {"cmd": {"required": true, "type": "string", "description": "Arbitrary Linux command to be executed on the local host."}, "sudo": {"immutable": true}}, "ref": "core.local", "id": "58c9663a49d4af4cbd56f84d", "name": "local"}, "liveaction": {"runner_info": {}, "parameters": {"cmd": "date"}, "action_is_workflow": false, "callback": {}, "action": "core.local", "id": "58de117e49d4af083399181b"}, "id": "58de117e49d4af083399181c"}
    # -------- end 140183979680976 response ------------

    # -------- begin 140183979680976 request ----------
    curl -X GET -H  'Connection: keep-alive' -H  'Accept-Encoding: gzip, deflate' -H  'Accept: */*' -H  'User-Agent: python-requests/2.11.1' -H  'X-Auth-Token: da5ecf3b0ab841008d663052fe95cddd' http://127.0.0.1:9101/v1/executions/58de117e49d4af083399181c
    # -------- begin 140183979680976 response ----------
    {"status": "succeeded", "start_timestamp": "2017-03-31T08:21:18.828620Z", "log": [{"status": "requested", "timestamp": "2017-03-31T08:21:18.843000Z"}, {"status": "scheduled", "timestamp": "2017-03-31T08:21:18.943000Z"}, {"status": "running", "timestamp": "2017-03-31T08:21:19.041000Z"}, {"status": "succeeded", "timestamp": "2017-03-31T08:21:19.242000Z"}], "parameters": {"cmd": "date"}, "runner": {"runner_module": "local_runner", "uid": "runner_type:local-shell-cmd", "enabled": true, "name": "local-shell-cmd", "runner_parameters": {"sudo": {"default": false, "type": "boolean", "description": "The command will be executed with sudo."}, "timeout": {"default": 60, "type": "integer", "description": "Action timeout in seconds. Action will get killed if it doesn't finish in timeout seconds."}, "cmd": {"type": "string", "description": "Arbitrary Linux command to be executed on the host."}, "kwarg_op": {"default": "--", "type": "string", "description": "Operator to use in front of keyword args i.e. \"--\" or \"-\"."}, "env": {"type": "object", "description": "Environment variables which will be available to the command(e.g. key1=val1,key2=val2)"}, "cwd": {"type": "string", "description": "Working directory where the command will be executed in"}}, "id": "58c9663a49d4af4cbd56f847", "description": "A runner to execute local actions as a fixed user."}, "elapsed_seconds": 0.378813, "web_url": "https://st2expect/#/history/58de117e49d4af083399181c/general", "result": {"failed": false, "stderr": "", "return_code": 0, "succeeded": true, "stdout": "Fri Mar 31 08:21:19 UTC 2017"}, "context": {"user": "st2admin"}, "action": {"runner_type": "local-shell-cmd", "name": "local", "parameters": {"cmd": {"required": true, "type": "string", "description": "Arbitrary Linux command to be executed on the local host."}, "sudo": {"immutable": true}}, "tags": [], "enabled": true, "entry_point": "", "notify": {}, "uid": "action:core:local", "pack": "core", "ref": "core.local", "id": "58c9663a49d4af4cbd56f84d", "description": "Action that executes an arbitrary Linux command on the localhost."}, "liveaction": {"runner_info": {"hostname": "st2expect", "pid": 1657}, "parameters": {"cmd": "date"}, "action_is_workflow": false, "callback": {}, "action": "core.local", "id": "58de117e49d4af083399181b"}, "id": "58de117e49d4af083399181c", "end_timestamp": "2017-03-31T08:21:19.207433Z"}
    # -------- end 140183979680976 response -----------

    id: 58de117e49d4af083399181c
    status: succeeded
    parameters:
      cmd: date
    result:
      failed: false
      return_code: 0
      stderr: ''
      stdout: Fri Mar 31 08:21:19 UTC 2017
      succeeded: true

``--debug`` オプションを指定することで、通常の出力に加えて、アクションが実行されるまでの全過程で発行される API リクエストを ``curl`` コマンド形式で確認できます。
なおこの結果は |st2| ホストで直接コマンドを実行した場合に生成される API リクエストで、Nginx などのプロキシを経由して実行した場合は、URI が ``/api`` になります。

従って、リモートノードから特定のアクションを確実に実行し、結果を取得するには以下のようにします。

.. sourcecode:: bash

    curl -X POST https://[ST2_IP]/api/v1/executions -H  'Connection: keep-alive' -H  'Accept-Encoding: gzip, deflate' -H  'Accept: */*' -H  'User-Agent: python-requests/2.11.1' -H  'content-type: application/json' -H  'X-Auth-Token: matoken' -H  'Content-Length: 69' --data-binary '{"action": "core.local", "user": null, "parameters": {"cmd": "date"}}'
