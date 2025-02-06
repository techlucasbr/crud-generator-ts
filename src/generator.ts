import fs from 'fs';
import path from 'path';

const generateFiles = (resourceName: string) => {
  const className = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  const fileName = resourceName
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');

  const entityTemplate = `
import { Entity, Column, PrimaryColumn, BeforeInsert, BeforeUpdate, DeleteDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: '${resourceName.replace(/([A-Z])/g, '_$1').toLowerCase()}',
  schema: process.env.DB_CONNECTION_SCHEMA,
})

export class ${className} {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  // add your columns here

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;
 
  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at?: Date;
  
  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at?: Date;
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

const ${fileName.replace(/-/g, '')}Routes = Router();
const ${resourceName}Controller = new ${className}Controller();

${fileName.replace(/-/g, '')}Routes.get('/', async (_req, res) => {
  const response = await ${resourceName}Controller.getAll();
  res.status(200).json(response);
});

${fileName.replace(/-/g, '')}Routes.get('/:id', async (req, res) => {
  const response = await ${resourceName}Controller.getById(parseInt(req.params.id));
  res.status(200).json(response);
});

${fileName.replace(/-/g, '')}Routes.post('/', async (req, res) => {
  const response = await ${resourceName}Controller.create(req.body);
  res.status(201).json(response);
});

${fileName.replace(/-/g, '')}Routes.put('/:id', async (req, res) => {
  const response = await ${resourceName}Controller.update(parseInt(req.params.id), req.body);
  res.status(200).json(response);
});

${fileName.replace(/-/g, '')}Routes.delete('/:id', async (req, res) => {
  await ${resourceName}Controller.delete(parseInt(req.params.id));
  res.status(200).json({ message: 'Registro deletado com sucesso' });
});

export default ${fileName.replace(/-/g, '')}Routes;
`;

  const dirs = [
    'src/infra/entity',
    'src/controllers',
    'src/repositories',
    'src/routes'
  ].map(dir => dir.split('/').join(path.sep));

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  fs.writeFileSync(`src/infra/entity/${fileName}.ts`, entityTemplate.trim());
  fs.writeFileSync(`src/controllers/${fileName}-controller.ts`, controllerTemplate.trim());
  fs.writeFileSync(`src/repositories/${fileName}-repository.ts`, repositoryTemplate.trim());
  fs.writeFileSync(`src/routes/${fileName}.routes.ts`, routeTemplate.trim());

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

  const routesIndexPath = 'src/routes/index.ts';
  let routesIndexContent = fs.existsSync(routesIndexPath)
    ? fs.readFileSync(routesIndexPath, 'utf8')
    : '';

  const routeImportLine = `import ${fileName}Routes from './${fileName}.routes';\n`;
  const routeUseLine = `routes.use('/${fileName}', isAuthenticated, ${fileName}Routes);\n`;

  if (!routesIndexContent.includes(routeImportLine)) {
    routesIndexContent = routeImportLine + routesIndexContent;

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