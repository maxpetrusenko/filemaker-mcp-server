# Publishing FileMaker MCP Server to npm

## Prerequisites

1. **npm account**: Make sure you have an npm account
2. **Login to npm**: Run `npm login` in your terminal
3. **Unique package name**: The package name should be unique on npm

## Publishing Steps

### 1. Update package.json (if needed)
```bash
# Update the package name if needed (make sure it's unique)
npm pkg set name="filemaker-mcp-server"

# Update author information
npm pkg set author.name="Max Petrusenko"
npm pkg set author.email="max.petrusenko@gmail.com"
```

### 2. Build and Test
```bash
npm run build
npm test
```

### 3. Publish
```bash
npm publish
```

### 4. Verify Publication
```bash
npm view filemaker-mcp-server
```

## Alternative: Publish as Scoped Package

If the package name is taken, you can publish under your npm scope:

```bash
# Update package name to include your scope
npm pkg set name="@amxpetrusenko/filemaker-mcp-server"

# Publish
npm publish --access public
```

## After Publishing

Users can then install and use your package:

```bash
npm install -g @maxpetrusenko/filemaker-mcp-server
filemaker-mcp-server --help
```

## Updating the Package

For future updates:

1. Update version in package.json
2. Build and test
3. Publish: `npm publish`

```bash
npm version patch  # or minor/major
npm publish
``` 