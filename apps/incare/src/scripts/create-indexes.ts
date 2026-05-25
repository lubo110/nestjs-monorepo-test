// 由于 mongoose 的 autoIndex设置成了false，所以集合不会自动创建索引，需要执行该文件创建对应数据库中的索引
// npm run build
// 执行命令：node dist/scripts/create-indexes.js
import * as fs from 'node:fs'
import * as path from 'node:path'
import mongoose from 'mongoose'

// ---------- 配置 ----------
const mongoUrl = 'mongodb+srv://atlasdev:iCmw9bvVqRTaeUG1@cluster0.ndq1gc0.mongodb.net/incare_v2?retryWrites=true&w=majority' // 替换你的 MongoDB 地址
const modulesDir = path.resolve(__dirname, '../modules') // modules 目录

// eslint-disable-next-line regexp/no-unused-capturing-group
const schemaFileRegex = /\.(schema|schemas)\.js$/ // 匹配 schema 文件

// ---------- 扫描并加载所有 schema ----------
async function loadSchemas(dir: string) {
  const schemas: { name: string, schema: mongoose.Schema }[] = []

  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // 递归子目录
      const subSchemas = await loadSchemas(fullPath)
      schemas.push(...subSchemas)
    }

    else if (stat.isFile() && schemaFileRegex.test(file)) {
      // 动态导入 schema 文件
      const module = await import(fullPath)
      // 支持 export default 和 export { ... } 两种情况
      for (const key in module) {
        if (module[key] instanceof mongoose.Schema) {
          schemas.push({ name: key, schema: module[key] })
        }
      }
    }
  }

  return schemas
}
// ---------- 创建索引 ----------
async function createIndexes() {
  try {
    await mongoose.connect(mongoUrl)
    console.log('✅ MongoDB 连接成功')

    const schemas = await loadSchemas(modulesDir)

    for (const { name, schema } of schemas) {
      const model = mongoose.model(name, schema)
      await model.syncIndexes()
      console.log(`✅ ${name} 索引创建成功！`)
    }

    console.log('🎉 所有索引创建完成！')
  }
  catch (err) {
    console.error('❌ 创建索引失败：', err)
  }
  finally {
    await mongoose.disconnect()
    console.log('数据库连接已断开')
  }
}

// ---------- 执行 ----------
createIndexes()
