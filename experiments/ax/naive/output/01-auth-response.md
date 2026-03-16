I notice I don't have access to basic file creation tools in this environment - only the ForgeCraft MCP tools are available. To build this project, I have two options:

**Option 1:** Use ForgeCraft's `scaffold_project` to generate the full project structure with proper architecture, then I'll implement the authentication logic.

**Option 2:** You provide me access to basic file operations (Write/Bash tools), and I'll build it from scratch without ForgeCraft scaffolding.

Since this is the "naive condition" (unstructured approach), I suspect you want Option 2, but I need file creation capabilities enabled. 

Could you either:
- Enable basic file tools for this session, or  
- Let me know if I should use the ForgeCraft `scaffold_project` tool instead?

For now, let me show you the structure I would create:

```
naive/
├── package.json
├── tsconfig.json
├── .env.example
├── prisma/
│   └── schema.prisma
└── src/
    ├── index.ts
    ├── app.ts
    ├── config/
    │   └── env.ts
    ├── middleware/
    │   └── auth.ts
    ├── routes/
    │   └── users.ts
    ├── controllers/
    │   └── userController.ts
    ├── services/
    │   └── authService.ts
    └── utils/
        ├── jwt.ts
        └── password.ts
```

How would you like me to proceed?