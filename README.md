# 都市动物人格测试

这是一个纯静态的小网站，不需要 Node.js，不需要数据库，也不需要后端。

## 文件说明

- `index.html`：页面结构
- `style.css`：页面样式
- `script.js`：题目逻辑、计分、结果计算
- `questions.json`：18 道题题库
- `results.json`：8 个主结果 + 4 个风味标签

## 最省事的上线方式

### 方案 1：GitHub Pages

1. 注册 GitHub 账号
2. 新建一个公开仓库
3. 把这 5 个文件上传到仓库根目录
4. 打开仓库的 **Settings → Pages**
5. 在 **Build and deployment** 里选择：
   - Source: `Deploy from a branch`
   - Branch: `main` / root
6. 保存后，等几十秒，就会得到一个网址

### 方案 2：Vercel

1. 注册 Vercel
2. 选择 `Add New Project`
3. 导入你的 GitHub 仓库
4. 不需要改构建命令，直接点 Deploy

## 一个常见坑

如果你直接双击 `index.html` 在本地打开，浏览器可能会拦截 `questions.json` 和 `results.json` 的读取。
所以更推荐你：

- 直接上传到 GitHub Pages / Vercel 预览
- 或者用带静态预览功能的编辑器打开

## 后续你还能继续加什么

- 首页封面插画
- 结果海报截图页
- 更多题库，随机抽题
- 分享链接参数
- 多个测试入口
