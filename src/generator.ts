import fs from 'fs';

const generateFiles = (resourceName: string) => {
  // Converte para PascalCase para nomes de classes
  const className = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  // Converte para kebab-case para nomes de arquivos
  const fileName = resourceName.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();

  // Templates
  const entityTemplate = `
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({
  name: '${resourceName.replace(/([A-Z])/g, '_$1').toUpperCase()}',
  schema: process.env.DB_CONNECTION_SCHEMA,
})
export class ${className} {
  @PrimaryColumn({ type: 'int', name: 'ID' })
  id: number;

  // Adicione suas colunas aqui
  
  @Column({ type: 'varchar', length: 255, name: 'USUARIO_INCLUSAO' })
  usuarioInclusao: string;

  @Column({ type: 'timestamp', name: 'DATA_INCLUSAO' })
  dataInclusao: Date;

  @Column({ type: 'varchar', length: 255, name: 'USUARIO_ALTERACAO' })
  usuarioAlteracao: string;

  @Column({ type: 'timestamp', name: 'DATA_ALTERACAO' })
  dataAlteracao: Date;
}
`;

  const controllerTemplate = `
import { Body, Controller, Delete, Get, Path, Post, Put, Route, Tags } from 'tsoa';
import { AppDataSource } from '../infra/database/main';
import { ${className}Repository } from '../repositories/${fileName}-repository';

@Route('${fileName}')
@Tags('${className}')
export class ${className}Controller extends Controller {
  private repository = new ${className}Repository(AppDataSource);

  @Get('/')
  public async getAll(): Promise<any> {
    return await this.repository.findAll();
  }
  
  @Get('/{id}')
  public async getById(@Path() id: number): Promise<any> {
    return await this.repository.findById(id);
  }

  @Post('/')
  public async create(@Body() body: any): Promise<any> {
    return await this.repository.create(body);
  }

  @Put('/{id}')
  public async update(@Path() id: number, @Body() body: any): Promise<any> {
    return await this.repository.update(id, body);
  }

  @Delete('/{id}')
  public async delete(@Path() id: number): Promise<any> {
    await this.repository.deleteById(id);
    return { message: 'Deletado com sucesso' };
  }
}
`;

  const repositoryTemplate = `
import { DataSource, Repository } from 'typeorm';
import { ${className} } from '../infra/entity/${fileName}';

export class ${className}Repository {
  private repository: Repository<${className}>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(${className});
  }

  async findAll(): Promise<${className}[]> {
    return await this.repository.find();
  }

  async findById(id: number): Promise<${className} | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async create(entity: Partial<${className}>): Promise<${className}> {
    const newEntity = this.repository.create(entity);
    return await this.repository.save(newEntity);
  }

  async update(id: number, updatedData: Partial<${className}>): Promise<${className} | null> {
    const entity = await this.findById(id);
    if (!entity) {
      return null;
    }
    Object.assign(entity, updatedData);
    return await this.repository.save(entity);
  }

  async deleteById(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
`;

  const routeTemplate = `
import { Router } from 'express';
import { ${className}Controller } from '../controllers/${fileName}-controller';

const ${fileName}Routes = Router();
const ${resourceName.toLowerCase()}Controller = new ${className}Controller();

${fileName}Routes.get('/', async (_req, res) => {
  const response = await ${resourceName.toLowerCase()}Controller.getAll();
  res.status(200).json(response);
});

${fileName}Routes.get('/:id', async (req, res) => {
  const response = await ${resourceName.toLowerCase()}Controller.getById(parseInt(req.params.id));
  res.status(200).json(response);
});

${fileName}Routes.post('/', async (req, res) => {
  const response = await ${resourceName.toLowerCase()}Controller.create(req.body);
  res.status(201).json(response);
});

${fileName}Routes.put('/:id', async (req, res) => {
  const response = await ${resourceName.toLowerCase()}Controller.update(parseInt(req.params.id), req.body);
  res.status(200).json(response);
});

${fileName}Routes.delete('/:id', async (req, res) => {
  await ${resourceName.toLowerCase()}Controller.delete(parseInt(req.params.id));
  res.status(200).json({ message: 'Registro deletado com sucesso' });
});

export default ${fileName}Routes;
`;

  // Criar diretórios se não existirem
  const dirs = [
    'src/infra/entity',
    'src/controllers',
    'src/repositories',
    'src/routes'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Escrever arquivos
  fs.writeFileSync(`src/infra/entity/${fileName}.ts`, entityTemplate.trim());
  fs.writeFileSync(`src/controllers/${fileName}-controller.ts`, controllerTemplate.trim());
  fs.writeFileSync(`src/repositories/${fileName}-repository.ts`, repositoryTemplate.trim());
  fs.writeFileSync(`src/routes/${fileName}.routes.ts`, routeTemplate.trim());

  // Atualizar index.ts das entidades
  const entityIndexPath = 'src/infra/entity/index.ts';
  let entityIndexContent = fs.existsSync(entityIndexPath) 
    ? fs.readFileSync(entityIndexPath, 'utf8')
    : '';

  const importLine = `import { ${className} } from './${fileName}';\n`;
  const exportLine = `  ${className},\n`;

  if (!entityIndexContent.includes(importLine)) {
    entityIndexContent = importLine + entityIndexContent;
    if (!entityIndexContent.includes('export {')) {
      entityIndexContent += `\nexport {\n${exportLine}};\n`;
    } else {
      entityIndexContent = entityIndexContent.replace(
        /export {/,
        `export {\n${exportLine}`
      );
    }
    fs.writeFileSync(entityIndexPath, entityIndexContent);
  }

  // Atualizar routes/index.ts
  const routesIndexPath = 'src/routes/index.ts';
  let routesIndexContent = fs.existsSync(routesIndexPath)
    ? fs.readFileSync(routesIndexPath, 'utf8')
    : '';

  const routeImportLine = `import ${fileName}Routes from './${fileName}.routes';\n`;
  const routeUseLine = `routes.use('/${fileName}', isAuthenticated, ${fileName}Routes);\n`;

  if (!routesIndexContent.includes(routeImportLine)) {
    // Adicionar import
    routesIndexContent = routeImportLine + routesIndexContent;
    
    // Adicionar route.use antes do export
    routesIndexContent = routesIndexContent.replace(
      /export default routes;/,
      `${routeUseLine}export default routes;`
    );
    
    fs.writeFileSync(routesIndexPath, routesIndexContent);
  }

  console.log(`Resource ${className} created successfully!`);
};

export const run = () => {
  const resourceName = process.argv[2];
  if (!resourceName) {
    console.error('Please provide a resource name!');
    process.exit(1);
  }

  generateFiles(resourceName);
};