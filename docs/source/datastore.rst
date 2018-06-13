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

データを特定のユーザのスコープで登録することもできます。ユーザ認証機能を有効化させることで、登録した変数を読み書きできるユーザを限定することができます（こうした変数をユーザ変数と定義します）。例えば、現在ログインしているユーザでユーザ変数 ``date_cmd`` を作成するには次のようにします。

.. code-block:: bash

    st2 key set date_cmd "date -u" --scope=user

ユーザ名は ``X-Auth-Token`` や ``St2-Api-Key`` ヘッダで渡されるアクセストークンや API キーによって決まります。認証 API への呼び出しによって |st2| は登録する値を特定のユーザにひもづけます。

登録した値を取得するには以下のようにします。

.. code-block:: bash

    st2 key get date_cmd --scope=user

システム変数として ``date_cmd`` を設定したい場合には、以下のようにします。

.. code-block:: bash

    st2 key set date_cmd "date +%s" --scope=system

以下のコマンドもこれと等価です。

.. code-block:: bash

    st2 key set date_cmd "date +%s"

別々のユーザが同名のユーザ変数を定義しても値の衝突は発生しません。ユーザ変数はアクションやワークフローからも参照できます。Jinja テンプレートから参照する場合には ``{{st2kv.user.date_cmd}}`` のように記述します。

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


Referencing Key-Value Pairs in Rule Definitions
-----------------------------------------------

Key-value pairs are referenced via specific string substitution syntax in rules. In general, the
variable for substitution is enclosed with double brackets (i.e. ``{{var1}}``). To refer to a
key-value pair, prefix the name with "st2kv.system", e.g. ``{{st2kv.system.os_keystone_endpoint}}``.

An example rule is provided below. Please refer to the :doc:`Rules </rules>` documentation for
rule-related syntax.

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
                "os_keystone_endpoint": "{{st2kv.system.os_keystone_endpoint}}"
            }
        }
    }

.. _admin-setup-for-encrypted-datastore:

Securing Secrets (admin only)
-----------------------------

The key-value store allows users to store encrypted values (secrets). Symmetric encryption
using AES-256 is used to encrypt secrets. The |st2| administrator is responsible for generating the
symmetric key used for encryption/decryption. Note that the |st2| operator and administrator
(or anyone else who has access to the key) can decrypt the encrypted values.

To generate a symmetric crypto key, please run:

.. code-block:: bash

    sudo mkdir -p /etc/st2/keys/
    sudo st2-generate-symmetric-crypto-key --key-path /etc/st2/keys/datastore_key.json

We recommend that the key is placed in a private location such as ``/etc/st2/keys/`` and
permissions are set such that only the |st2| API process owner (usually ``st2``)
can read the file, and only root can write to it.

To make sure only ``st2`` and root can access the file on the box, run:

.. code-block:: bash

    sudo usermod -a -G st2 st2                              # Add user ``st2`` to ``st2`` group
    sudo mkdir -p /etc/st2/keys/
    sudo chown -R st2:st2 /etc/st2/keys/                    # Give user and group ``st2`` ownership for key
    sudo chmod o-r /etc/st2/keys/                           # Revoke read access for others
    sudo chmod o-r /etc/st2/keys/datastore_key.json         # Revoke read access for others

Once the key is generated, |st2| needs to be made aware of the key. To do this, edit the st2
configuration file (``/etc/st2/st2.conf``) and add the following lines:

.. code-block:: ini

    [keyvalue]
    encryption_key_path = /etc/st2/keys/datastore_key.json

Once the config file changes are made, restart |st2|:

.. code-block:: bash

  sudo st2ctl restart

Validate you are able to set an encrypted key-value in the datastore:

.. code-block:: bash

  st2 key set test_key test_value --encrypt

If you see errors like ``"MESSAGE: Crypto key not found"``, something has gone wrong with setting
up the keys.

.. _datastore-storing-secrets-in-key-value-store:

Storing Secrets
---------------

Please note that if an admin has not setup an encryption key, you will not be allowed to save
secrets in the key-value store. Contact your |st2| admin to setup encryption keys as per the
section above.

To save a secret in the key-value store:

.. code-block:: bash

    st2 key set api_token SECRET_TOKEN --encrypt

By default, getting a key tagged as secret (via ``--encrypt``) will always return encrypted values
only. To get plain text, please run the command with the ``--decrypt`` flag:

.. code-block:: bash

    st2 key get api_token --decrypt

.. note::

    Keep in mind that ``--decrypt`` flag can either be used by an administrator (administrator is
    able to decrypt every value) and by the user who set that value in case of the user-scoped
    datastore items (i.e. if ``--scope=user`` flag was passed when originally setting the value).

If you are using system scoped variables (``st2kv.system``) to store secrets, you can decrypt them
and use as parameter values in rules or actions. This is supported via Jinja filter ``decrypt_kv``
(read more about :ref:`Jinja filters<applying-filters-with-jinja>`). For example,
to pass a decrypted password as a parameter, use:

.. code-block:: YAML

    aws_key: "{{st2kv.system.aws_key | decrypt_kv}}"

Decrypting user scoped variables is currently unsupported.

Secret keys can be loaded from a JSON/YAML key file by adding the ``secret`` property with
a boolean value.

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

Security notes
--------------

We wish to discuss security details and be transparent about the implementation and limitations
of the security practices to attract more eyes to it and therefore build better quality into
security implementations. For the key-value store, we have settled on AES-256 symmetric encryption
for simplicity. We use the Python library keyczar for doing this.

We have made a trade-off that the |st2| admin is allowed to decrypt the secrets in the key-value
store. This made our implementation simpler. We are looking into how to let users pass their own
keys for encryption every time they want to consume a secret from the key-value store. This
requires more UX thought and also moves the responsibility of storing keys to the users. Your
ideas are welcome here.

Please note that the global encryption key means that users with direct access to the database
will only see encrypted secrets in the database. Still, the onus is on the |st2| admin to restrict
access to the database via network daemons only and not allow physical access to the box (or run
databases on different boxes to st2). Note that several layers of security need to be in place,
beyond the scope of this document. While we can help people with deployment questions on the
StackStorm Slack community, please follow your own best security practices guide.
