インストール
============

ここでは |st2| をインストールする方法の全体像を示します。

|st2| は、RPM 及び deb パッケージによるインストールの他、Docker による環境構築に加え、インストールスクリプトによる自動インストールといった、様々なインストール方法を提供しています。以下に |st2| がサポートするインストール方法の選択肢を示します。

* **Vagrant / Virtual Appliance:**
  `Vagrant のインストール </install/vagrant>` ができた環境であれば、コマンド ``vagrant init stackstorm/st2 && vagrant up`` だけで StackStorm がインストールされた環境を構築できます。動作確認済の StackStorm が既にインストールされているイメージを使うことで、インストールや設定の手間や時間を省けます。StackStorm の動作の確認や、pack の開発、デモなどの用途に最適です。
* **One-line Install:**
  これはインストールスクリプトによって全てのコンポーネントを単一ホストにインストールする方法です。
  とりあえず |st2| を使ってみたいといった場合には、こちらの方法がお勧めです。詳しくは後述の :ref:`Quick Install <ref-one-line-install>` をご覧ください。
* **Manual Installation:**
  カスタマイズや細かなニーズに合わせて手動でインストールしたい場合は、各 GNU/Linux ディストリビューション (:doc:`Ubuntu 14/16 </install/deb>`、:doc:`RHEL/CentOS 6 </install/rhel6>`、:doc:`RHEL/CentOS 7 </install/rhel7>`) 毎のマニュアルが用意されていますので、お使いの環境にあったものをご覧ください。
  もしインターネットから切り離した環境で |st2| を構築するため、リポジトリミラーを構築する場合には
  `こちらのドキュメント <https://stackstorm.com/2017/02/10/installing-stackstorm-offline-systems/>`_
  もご参照ください。
* **Ansible Playbooks:**
  Ansible によるインストールを行う場合には、:doc:`/install/ansible` をご覧ください。
* **Docker:**
  |st2| は Docker イメージを提供しています。詳しくは :doc:`Docker による環境構築 <docker>` をご覧ください。

ニーズに合わせて最適な方法をお選びください。

|bwc| にアップグレードしたい場合は、StackStorm がインストールされた環境にパッケージを追加する形でアップグレードできます (もちろん StackStorm と |bwc| を同時にイストールすることもできます)。
|bwc| を使うことで Network Automation Suites を利用できるようになります。詳しくは :doc:`/install/bwc` をご覧ください。

.. _ref-one-line-install:

.. rubric:: クイックスタート

:doc:`システム要求 <system_requirements>` を満たす **まっさらな** 64-bit GNU/Linux 環境が用意できたら、
``sudo apt-get install curl``  や ``sudo yum install curl nss`` を実行し ``curl`` が最新版であることを確認したうえで、
以下コマンドを実行してください。

.. code-block:: bash

   curl -sSL https://stackstorm.com/packages/install.sh | bash -s -- --user=st2admin --password='Ch@ngeMe'

このコマンドは :doc:`シングルホストへのデプロイ後の構成 <./overview>` で示す通り、全てのコンポーネントをコマンドを実行したホストにインストールします。

上記コマンドは OS インストール直後のまっさらな環境で実行してください。そうでない場合、インストールに失敗する可能性があります。その場合は、手動で問題解決と残りのインストール作業を行う必要があります。
上記インストールスクリプトは冪等性がないため、インストール処理に失敗した場合には OS 環境をまっさらにし直した上で再実行してください。

またプロキシ経由でインストールする場合、上記インストールコマンドを実行する前に、以下の環境変数を設定してください。

.. code-block:: bash

  export http_proxy=http://proxy.server.io:port
  export https_proxy=http://proxy.server.io:port
  export no_proxy=localhost,127.0.0.1

もし MITM プロキシを利用する場合は、上記に加え環境変数 ``proxy_ca_bundle_path`` も設定する必要があります (c.f. :ref:`packs-behind-proxy`)。

また RHEL 7 もしくは CentOS 7 の環境における Web UI アクセスで問題が生じる場合は、:ref:`system firewall settings <ref-rhel7-firewall>` をご参照ください。

.. include:: __installer_passwords.rst

.. rubric:: Other Installation Options

デプロイ後のサービス構成や、その他のインストール方法については以下をご覧ください。

.. toctree::
    :maxdepth: 1

    デプロイ後の構成 <overview>
    system_requirements
    Vagrant / OVA <vagrant>
    Ubuntu 14.04 / 16.04 <deb>
    RHEL 7 / CentOS 7 <rhel7>
    RHEL 6 / CentOS 6 <rhel6>
    Docker <docker>
    Ansible Playbooks <ansible>
    Extreme Workflow Composer <bwc>
    config/index
    upgrades
    uninstall
