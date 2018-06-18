データストア
===============================

データストアサービス (以下、データストア) の目的は、ユーザが |st2| ノードの共通パラメータや、センサ、アクション、ルールが参照する値を設定できるようにすることです。データストアに登録するデータは key-value 型で、ユーザは |st2| の CLI や Python クライアントから登録/取得できます。

センサとアクションのプラグインは、Python クライアントから key-value ペアにアクセスします。YAML/JSON 形式で記述されたのルールの場合は、それぞれのデータ形式に従って解析した上でデータを評価します。

自動化の有効期限を設定する目的などで、データストアに登録する key-value ペアの値に TTL を設定することもできます。

.. note::

   現在はデータストアに登録できる値は文字列しかサポートしていませんが、これは機能をシンプルに保ち既存の API, CLI との互換性を保つ為のものです。

   もし文字列以外の構造化したデータをデータストアに登録したい場合には、JSON をシリアライズして登録することもできます。その場合、アクションやセンサのコード内で、JSON データに戻す処理を実装するか、Jinja フィルタ ``from_json_string`` を使用する必要があります。詳しくは :doc:`/reference/jinja` を参照してください。

   なお、これらの機能は将来変更される可能性があります。

CLI による Key-Value ペアの登録と取得方法
-----------------------------------------

key-value ペアの値を登録方法

.. code-block:: bash

    st2 key set os_keystone_endpoint http://localhost:5000/v2.0
    st2 key set aws_cfn_endpoint https://cloudformation.us-west-1.amazonaws.com

登録済みの key-value ペアの値の一覧と key 毎に値を取得する方法

.. code-block:: bash

    # To list first 50 key-value pairs (default)
    st2 key list
    # To list all the key-value pairs in the datastore
    st2 key list -n -1

    # Get value for key "os_keystone_endpoint"
    st2 key get os_keystone_endpoint
    # Get value for key "os_keystone_endpoint" in json format
    st2 key get os_keystone_endpoint -j

登録済みの key-value ペアの値を更新する方法

.. code-block:: bash

    st2 key set os_keystone_endpoint http://localhost:5000/v3

登録済みの key-value ペアの値を削除する方法

.. code-block:: bash

    st2 key delete os_keystone_endpoint


CLI からの数値、オブジェクト、配列値の登録・取得
------------------------------------------------

ここまで、データストアに登録する key-value ペアの値は全て文字列でした。もし文字列以外のデータ型の値を登録したい場合には、JSON 形式にシリアライズして登録し、アクションやセンサ定義ファイルからデータを取得する際に復元します。アクション定義ファイルからデータを参照する方法は :ref:`後述<referencing-key-value-pairs-in-action-definitions>` します。

``number`` / ``integer`` 型の値を登録するには以下のようにします。

.. code-block:: bash

    st2 key set retention_days 7

    
``object`` 型の値を登録するには、以下のように JSON 形式にシリアライズします。

.. code-block:: bash

    st2 key set complex_data '{"name": "Dave Smith", "age": 7, "is_parent": True}'

    
``array`` 型の値を登録するには、同様にに JSON 形式にシリアライズします。

.. code-block:: bash

    st2 key set number_list '[1, 2, 3, 4]'
    st2 key set object_list '[{"name": "Eric Jones"}, {"name": "Bob Seger"}]'
    
ファイルから key-value ペアを読み込む方法
-----------------------------------------

上記の例と同じ key-value ペアを指定した JSON ファイルを作成します。

.. code-block:: json

    [
        {
            "name": "os_keystone_endpoint",
            "value": "http://localhost:5000/v2.0"
        },
        {
            "name": "aws_cfn_endpoint",
            "value": "https://cloudformation.us-west-1.amazonaws.com"
        }
    ]

以下のコマンドで、上記ファイルで指定した key-value ペアのデータをデータストアに読み込ませます。

.. code-block:: bash

    st2 key load mydata.json

YAML 形式のデータも同様に読み込ませることができます。以下は、先ほどと等価なデータを YAML 形式で記述したものです。

.. code-block:: yaml

    ---
    - name: os_keystone_endpoint
      value: http://localhost:5000/v2.0
    - name: aws_cfn_endpoint
      value: https://cloudformation.us-west-1.amazonaws.com

以下のコマンドで読み込ませられます。

.. code-block:: bash

    st2 key load mydata.yaml

``st2 key load`` コマンドは ``st2 key list -j`` コマンドの出力から直接データをロードさせることもできます。
もし大量の key-value ペアが登録されている場合 ``st2 key list -n -1 -j`` によって全てのキーをエクスポートできます。
このコマンドは異なるクラスタからデータを移す場合や、データストアの登録値をバーション管理するためにファイルに変換（またはその逆の操作を）するのに便利です。

.. code-block:: bash

    # JSON
    st2 key list -n -1 -j > mydata.json
    st2 key load mydata.json

    # YAML
    st2 key list -n -1 -y > mydata.yaml
    st2 key load mydata.yaml


デフォルトでは、全ての key に対応する value は文字列でないといけませんが、JSON/YAML でサポートされている任意のデータ構造 (hash, array, int, boolean, etc) の value を設定できます。こうしたデータ構造を持ったファイルを ``st2 key load`` コマンドで読み込ませる場合 ``-c/--convert`` フラグを指定することで StackStorm はこれらの値をデータストアに登録する前に JSON 形式に変換します。

以下の構造化したデータを持つファイルをデータストアに読み込ませます。

.. code-block:: json

    [
        {
            "name": "managed_hosts",
            "value": [
                {
                    "ip_address": "192.168.1.1",
                    "fqdn": "myhost.domain.tld"
                },
                {
                    "ip_address": "192.168.1.2",
                    "fqdn": "myotherhost.domain.tld"
                }
            ]
        },
        {
            "name": "primary_vlan",
            "value": {
                "tag": 123,
                "note": "General purpose traffic"
            }
        }
    ]

``-c/--convert`` オプションを指定して、このファイルをデータストアに読み込ませます (非文字列の値はそれぞれシリアライズした文字列に変換されます)

.. code-block:: bash

    $ st2 key load -c mydata.json
    +---------------+-----------------------+--------+--------+------+-----+
    | name          | value                 | secret | scope  | user | ttl |
    +---------------+-----------------------+--------+--------+------+-----+
    | managed_hosts | [{"ip_address":       |        | system |      |     |
    |               | "192.168.1.1",        |        |        |      |     |
    |               | "fqdn":               |        |        |      |     |
    |               | "myhost.domain.tld"}, |        |        |      |     |
    |               | {"ip_address":        |        |        |      |     |
    |               | "192.168.1.2",        |        |        |      |     |
    |               | "fqdn": "myotherhost. |        |        |      |     |
    |               | domain.tld"}]         |        |        |      |     |
    | primary_vlan  | {"note": "General     |        | system |      |     |
    |               | purpose traffic",     |        |        |      |     |
    |               | "tag": 123}           |        |        |      |     |
    +---------------+-----------------------+--------+--------+------+-----+

同様に YAML 形式でも指定できます。
    
.. code-block:: yaml

    ---
    - name: managed_hosts
      value:
          - ip_address: 192.168.1.1
            fqdn: myhost.domain.tld
          - ip_address: 192.168.1.2
            fqdn: myotherhost.domain.tld
    - name: primary_vlan
      value:
          tag: 123
          note: General purpose traffic

JSON 形式の場合と同様に、以下のコマンドでロードされます。構造化されたデータはシリアライズした JSON の文字列に変換されます。

.. code-block:: bash

    $ st2 key load -c mydata.yaml
    +---------------+-----------------------+--------+--------+------+-----+
    | name          | value                 | secret | scope  | user | ttl |
    +---------------+-----------------------+--------+--------+------+-----+
    | managed_hosts | [{"ip_address":       |        | system |      |     |
    |               | "192.168.1.1",        |        |        |      |     |
    |               | "fqdn":               |        |        |      |     |
    |               | "myhost.domain.tld"}, |        |        |      |     |
    |               | {"ip_address":        |        |        |      |     |
    |               | "192.168.1.2",        |        |        |      |     |
    |               | "fqdn": "myotherhost. |        |        |      |     |
    |               | domain.tld"}]         |        |        |      |     |
    | primary_vlan  | {"note": "General     |        | system |      |     |
    |               | purpose traffic",     |        |        |      |     |
    |               | "tag": 123}           |        |        |      |     |
    +---------------+-----------------------+--------+--------+------+-----+
    
.. _datastore-scopes-in-key-value-store:

データのスコープ設定
--------------------

デフォルトでは |st2| の CLI/API から登録される key-value ペアのデータは全て ``st2kv.system`` のスコープに登録されます。これは、登録されるデータは全てのユーザから等しくアクセスできることを意味します。こうした値は Jinja の変数 ``{{st2kv.system.key_name}}`` によってアクションやワークフローからも参照できます。v2.0.1 以前では、データは ``system`` スコープに登録され、Jinja からは ``{{system.key_name}}`` から参照できますが、このスコープは v2.2 以降ではサポートされていません。

データを特定のユーザのスコープで登録することもできます。ユーザ認証機能を有効化させることで、登録した変数を読み書きできるユーザを限定することができます（こうした変数をユーザ変数と定義します）。現在ログインしているユーザでユーザ変数 ``date_cmd`` を作成するには次のようにします。

.. code-block:: bash

    st2 key set date_cmd "date -u" --scope=user

ユーザ名は、認証 API によって発行された ``X-Auth-Token`` ヘッダで渡されるアクセストークン (または ``St2-Api-Key`` ヘッダで渡される API キー) によって識別され、当該ユーザのスコープに key-value ペアのデータが登録されます。

登録した値を取得するには以下のようにします。

.. code-block:: bash

    st2 key get date_cmd --scope=user

システム変数として ``date_cmd`` を設定したい場合には、以下のようにします。

.. code-block:: bash

    st2 key set date_cmd "date +%s" --scope=system

以下のコマンドもこれと等価です。

.. code-block:: bash

    st2 key set date_cmd "date +%s"

システム変数とユーザ変数のスコープは別なので、同名のユーザ変数が定義されていたとしてもユーザ変数の値は上書きされません。ユーザ変数はアクションやワークフローからも参照できます。Jinja テンプレートから参照する場合には ``{{st2kv.user.date_cmd}}`` のように記述します。

ただし ``st2kv.user`` はユーザが手動でアクションやワークフローを実行した場合のみ設定されます。ルールによってアクションやワークフローが実行された場合 ``st2kv.user`` は設定されませんのでご注意ください。

JSON/YAML 形式のファイルから登録する際 ``scope`` プロパティを設定することでユーザ変数として登録できます。

JSON

.. code-block:: json

    [
        {
            "name": "date_cmd",
            "value": "date -u",
            "scope": "user"
        }
    ]

YAML

.. code-block:: yaml

    ---
    - name: date_cmd
      value: date -u
      scope: user
    
.. _datastore-ttl:

登録データの TTL
----------------

デフォルトでは、データストアに登録するデータに TTL (Time To Live) は設定されません。登録されたデータはユーザによって削除されるまで残ります。これに対して、登録データが一定時間経過後に自動的に削除されるようにするため、登録データの生存期間 (TTL) を設定することができます。

TTL として設定できる単位は「秒」です。以下では１時間後に削除される key-value ペアを登録します。

.. code-block:: bash

    st2 key set date_cmd "date +%s" --ttl=3600

TTL のユースケースの一つとして、自動復旧 (auto-remediation) のワークフローが頻繁に実行されるのを防止する使い方があります。例えば、ワークフローが実行された際に TTL が設定された変数を登録し、TTL が切れる前に２回目のワークフローが実行された際に、当該アクションの実行を回避するといった使い方ができます。
また、一定時間内に実行されたの回数を記録するといった使い方もできます。

JSON/YAML 形式ファイルから値を登録する場合 ``ttl`` プロパティから値を設定できます。

JSON

.. code-block:: json

    [
        {
            "name": "date_cmd",
            "value": "date -u",
            "ttl": 3600
        }
    ]

YAML

.. code-block:: yaml

    ---
    - name: date_cmd
      value: date -u
      ttl: 3600

Python Client から値を設定・取得
--------------------------------

以下では新規 key-value ペアを作成しています。Client オブジェクト生成時に |st2| の API エンドポイントの URL を引数 ``base_url`` (もしくは環境変数 ``ST2_BASE_URL``) に指定します。

.. code-block:: python

    >>> from st2client.client import Client
    >>> from st2client.models import KeyValuePair
    >>> client = Client(base_url='http://localhost')
    >>> client.keys.update(KeyValuePair(name='os_keystone_endpoint', value='http://localhost:5000/v2.0'))

登録済みの key-value ペアの値の一覧と key 毎に値を取得します。

.. code-block:: python

    >>> keys = client.keys.get_all()
    >>> os_keystone_endpoint = client.keys.get_by_name(name='os_keystone_endpoint')
    >>> os_keystone_endpoint.value
    u'http://localhost:5000/v2.0'

登録済みの key-value ペアを更新します。

.. code-block:: python

    >>> os_keystone_endpoint = client.keys.get_by_name(name='os_keystone_endpoint')
    >>> os_keystone_endpoint.value = 'http://localhost:5000/v3'
    >>> client.keys.update(os_keystone_endpoint)

登録済みの key-value ペアを削除します。

.. code-block:: python

    >>> os_keystone_endpoint = client.keys.get_by_name(name='os_keystone_endpoint')
    >>> client.keys.delete(os_keystone_endpoint)

暗号化した key-value ペアを作成します。

.. code-block:: python

    >>> client.keys.update(KeyValuePair(name='os_keystone_password', value='$uper$ecret!', secret=True))

暗号化された key-value ペアを取得して復号化します。

.. code-block:: python

    >>> os_keystone_password = client.keys.get_by_name(name='os_keystone_password', decrypt=True)
    >>> os_keystone_password.value
    u'$uper$ecret!'


全ての key-value ペアを取得し、それらを復号化します。

.. code-block:: python

    >>> keys = client.keys.get_all(params={'decrypt': True})
    >>> # or
    >>> keys = client.keys.query(decrypt=True)

登録済みの暗号化された key-value ペアを更新します。

.. code-block:: python

    >>> os_keystone_password = client.keys.get_by_name(name='os_keystone_password')
    >>> os_keystone_password.value = 'New$ecret!'
    >>> print os_keystone_password.secret
    True
    >>> client.keys.update(os_keystone_password)
    >>> client.keys.get_by_name(name='os_keystone_password', decrypt=True)
    <KeyValuePair name=os_keystone_password,value=New$ecret!>

TTL を設定した key-value ペアを作成します。

.. code-block:: python

    >>> from st2client.client import Client
    >>> from st2client.models import KeyValuePair
    >>> client = Client(base_url='http://localhost')
    >>> client.keys.update(KeyValuePair(name='os_keystone_endpoint', value='http://localhost:5000/v2.0', ttl=600))

.. _referencing-key-value-pairs-in-action-definitions:
    
アクション定義ファイルから key-value ペアを取得する方法
-------------------------------------------------------

key-value ペアはルール定義ファイルから置換構文を用いて参照できます。基本的にルール定義ファイルの中から変数を参照する場合、中括弧２つで囲んだ形 (例: ``{{var1}}``) で指定した変数に置換されます。登録済みの key-value ペアにアクセスするには ``st2kv.system`` の接頭辞をつけて ``{{st2kv.system.os_keystone_endpoint}}`` と記述します。

以下の簡単なアクション定義ファイルの例で解説します。

.. code-block:: bash
   
    st2 key set error_message "Remediation failure"

.. code-block:: yaml
                
    ---
    description: Remediates a host.
    enabled: true
    runner_type: mistral-v2
    entry_point: workflows/remediate.yaml
    name: remediate
    pack: default
    parameters:
      host:
        required: true
        type: string
      error_message:
        type: string
        default: "{{ st2kv.system.error_message }}"    
    

データストアから取得できる値のデータ型は文字列以外に以下のデータ型をサポートしています。

+----------+----------+-----------------------------+
| データ型 | 値       | 入力例                      |
+----------+----------+-----------------------------+
| integer  | 整数値   | 1, 234, 5678                |
+----------+----------+-----------------------------+
| number   | 数値     | 12.34, 0.123                |
+----------+----------+-----------------------------+
| array    | 配列     | ['foo', 'bar', 'baz']       |
+----------+----------+-----------------------------+
| object   | 連想配列 | {'name': 'jhon', 'age': 10} |
+----------+----------+-----------------------------+

これらの値を JSON 形式でシリアライズして登録した場合、アクション定義ファイルから取り出す場合、自動的にデータを復元（デシリアライズ）及び解析し ``st2kv.system`` パラメータから参照できるようにしています。

.. code-block:: bash
   
    st2 key set username "stanley"
    st2 key set -e password "$ecret1!"
    st2 key set num_network_adapters 1
    st2 key set vlan_config '{"vlan_100_general_use": {"tag": 100, "subnet": "10.1.1.0/24"}, "vlan_200_dmz": {"tag": 200, "subnet": "10.99.1.0/24"}}'
    st2 key set dns_servers '["10.0.0.10", "10.0.0.11"]'

.. code-block:: yaml
                    
    ---
    description: Provisions a VM
    enabled: true
    runner_type: mistral-v2
    entry_point: workflows/vm_provision.yaml
    name: vm_provision
    pack: default
    parameters:
      fqdn:
        type: string
        required: true
      username:
        type: string
        default: "{{ st2kv.system.username }}"
      password:
        type: string
        default: "{{ st2kv.system.password | decrypt_kv }}"
      num_network_adapters:
        type: integer
        default: "{{ st2kv.system.num_network_adapters }}"
      vlan:
        type: string
        required: true
      vlan_config:
        type: array
        default: "{{ st2kv.system.vlan_config }}"
      dns_servers:
        type: object
        default: "{{ st2kv.system.dns_servers }}"


ルール定義ファイルから key-value ペアを参照する
-----------------------------------------------
Similar to Action Definitions above, one can refer to a key-value pair by prefixing
the name with ``st2kv.system``, e.g. ``{{ st2kv.system.os_keystone_endpoint }}``.

以下は key-value ペアの参照を含むルール定義ファイルの例です。ルールに関する詳細は `Rules </rules>` を参照ください。

.. code-block:: json

    {
        "name": "daily_clean_up_rule",
        "trigger": {
            "name": "st2.timer.daily"
        },
        "enabled": true,
        "action": {
            "name": "daily_clean_up_action",
            "parameters": {
                "os_keystone_endpoint": "{{ st2kv.system.os_keystone_endpoint }}"
            }
        }
    }

.. _admin-setup-for-encrypted-datastore:

登録データの暗号化設定 (管理者のみ)
-----------------------------------

セキュリティ上の目的で登録データを暗号化させることができます。暗号化は AES-256 による共通鍵暗号方式によって行います。共通鍵は管理者が作成し、これにアクセスできるユーザのみデータを暗号化して登録できます。

共通鍵の生成は以下のようにして行います。

.. code-block:: bash

    sudo mkdir -p /etc/st2/keys/
    sudo st2-generate-symmetric-crypto-key --key-path /etc/st2/keys/datastore_key.json

鍵の置き場所 (ディレクトリ) と権限は、以下のとおり設定することを推奨します。

+-------------+--------------------------------------------+
| 設置場所    | /etc/st2/keys                              |
+-------------+--------------------------------------------+
| 権限(Read)  | st2 api のプロセスオーナー (主に ``st2``)  |
+-------------+--------------------------------------------+
| 権限(Write) | root                                       |
+-------------+--------------------------------------------+

.. code-block:: bash

    sudo usermod -a -G st2 st2                              # Add user ``st2`` to ``st2`` group
    sudo mkdir -p /etc/st2/keys/
    sudo chown -R st2:st2 /etc/st2/keys/                    # Give user and group ``st2`` ownership for key
    sudo chmod o-r /etc/st2/keys/                           # Revoke read access for others
    sudo chmod o-r /etc/st2/keys/datastore_key.json         # Revoke read access for others

鍵を生成したら、それを |st2| に認識させる必要があります。これを行うには |st2| の設定ファイル ``/etc/st2/st2.conf`` に以下の業を追加します。

.. code-block:: ini

    [keyvalue]
    encryption_key_path = /etc/st2/keys/datastore_key.json

設定ファイルの修正を反映させるために、以下のコマンドで |st2| を再起動させます。

.. code-block:: bash

  sudo st2ctl restart

以下のコマンドで、暗号化した key-value ペアのデータをデータストアに登録できるか確認できます。

.. code-block:: bash

  st2 key set test_key test_value --encrypt

もし ``MESSAGE: Crypto key not found`` といったエラーが表示された場合、共通鍵の設定に誤りがあります。

.. _datastore-storing-secrets-in-key-value-store:

暗号化データの保存
------------------

暗号化データの登録には鍵の登録が必須なため、もし |st2| にデータ暗号化のための鍵の登録が行われていない場合は、管理者に先述の :ref:`登録データの暗号化設定<admin-setup-for-encrypted-datastore>` に従って設定してください。

暗号化した key-value ペアの登録は以下のようにして行います。

.. code-block:: bash

    st2 key set api_token SECRET_TOKEN --encrypt

このように ``--encrypt`` フラグを付けて登録されたデータを取得すると、暗号化された値が返されます。暗号化される前のデータを取得するには、データ取得コマンドに ``--decrypt`` フラグを付けます。

.. code-block:: bash

    st2 key get api_token --decrypt

.. note::
    ``--decrypt`` フラグによるデータの復号化は、データを登録したユーザに加えて、管理者も全ての登録済みデータに対して復号化できる点に留意してください。

システムワイドなスコープ ``st2kv.system`` で登録した場合、以下のように ``decript_kv`` という :ref:`Jinja フィルター<applying-filters-with-jinja>` を利用することで、ルールやアクション定義ファイルからこれらにアクセスすることができます。

.. code-block:: YAML

    aws_key: "{{st2kv.system.aws_key | decrypt_kv}}"

JSON/YAML 形式ファイルからデータを読み込ませる際に暗号化するには ``secret`` フラグを true に設定することでできます。

JSON

.. code-block:: json

    [
        {
            "name": "api_token",
            "value": "SECRET_TOKEN",
            "secret": true
        }
    ]

YAML

.. code-block:: yaml

    ---
    - name: api_token
      value: SECRET_TOKEN
      secret: true

セキュリティノート
------------------

セキュリティの実装については、実用的な実装・制限について、透明性のある議論を通じて、ユーザの関心をより高めるとともに、品質向上を図りたいと考えています。実装をシンプルにするため、AES-256 による共通鍵暗号方式を採っており、実装には Python ライブラリ ``keyczar`` を使用しております。

シンプルな実装にしたために、管理者に暗号化するための唯一の鍵を持たせるという制約を作ってしまっています。これに対して我々は、ユーザが独自の鍵を利用してデータを暗号化できるようにする方法を検討しています。これには UX や安全性について注意深く検討する必要があると考えています。これについて、ユーザの皆さんの忌憚のないご意見をお待ちしています。

最後に、暗号化キーによって例えデータベースを直接読まれたとしても、そこには暗号化したデータしか存在しません。しかし |st2| 管理者には、直接データベースへのアクセスを制限し、ネットワークデーモンのみアクセスを許可するといったセキュリティ上の対策を施す責任があります。セキュリティ対策についてはそれだけではない多角的な対策を施す必要があります（ただ、本ドキュメントの主旨ではないため割愛します）。もし |st2| のデプロイについて Slack チャンネルでご質問いただければお助けできることがあると思いますが、皆さんにとってベストな方法で運用してみてください。
