# Super Simple Highlighter with Sync

- fork from: [https://github.com/dexterouslogic/super-simple-highlighter](https://github.com/dexterouslogic/super-simple-highlighter)
- fork verison: [https://github.com/dexterouslogic/super-simple-highlighter/commit/87cee217f8605cffa74cee45713b8fc145936a2f](https://github.com/dexterouslogic/super-simple-highlighter/commit/87cee217f8605cffa74cee45713b8fc145936a2f)

原有的 Super Simple Highlighter 插件非常好用，而且我一直在使用，但是我会存在多台设备，有「同步」的需求

计划

1. 在 Backups 标签页增加 Sync 按钮
2. Sync 操作，导出当前内容
3. 通过 HTTP 方式发送至后端
4. 后端进行「冲突合并」，并把合并后的结果发送至 插件

坑

1. 由于对 js 不是很熟悉，所以「冲突合并」在后端执行，就会导致每次传输数据量很大
    - 通过 gzip 进行压缩
2. 需要增加账户的功能
    - 鉴权，验证