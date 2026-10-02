import { ToolCategory } from 'twenty-shared/ai';

import { McpProtocolService } from 'src/engine/api/mcp/services/mcp-protocol.service';

// Tide fork (patch 2): a public request (through Cloudflare) must not list, learn or execute the mail, campaign and
// operator tools, and the server instructions must not name them; the apps' own tools (LOGIC_FUNCTION) stay. A tunnel
// request keeps upstream's behaviour. These drive the real meta-tools McpProtocolService builds, with the registry
// mocked.
describe('McpProtocolService — public requests (Tide fork)', () => {
  const workspace = { id: 'ws-1' } as never;
  const ENTRIES = [
    { name: 'send_email', category: ToolCategory.ACTION, description: '' },
    {
      name: 'create_calendar_event',
      category: ToolCategory.ACTION,
      description: '',
    },
    {
      name: 'find_people',
      category: ToolCategory.DATABASE_CRUD,
      description: '',
    },
    {
      name: 'create_complete_workflow',
      category: ToolCategory.WORKFLOW,
      description: '',
    },
    {
      name: 'app_tide_email_fill',
      category: ToolCategory.LOGIC_FUNCTION,
      description: '',
    },
  ];

  const setup = () => {
    const toolRegistry = {
      getToolsByName: jest.fn().mockResolvedValue({}),
      buildToolIndex: jest.fn(
        async (
          _ws: string,
          _role: string,
          options?: { categories?: string[] },
        ) =>
          options?.categories
            ? ENTRIES.filter((e) => options.categories!.includes(e.category))
            : ENTRIES,
      ),
      resolveAndExecute: jest
        .fn()
        .mockResolvedValue({ success: true, message: 'ran' }),
    };
    let toolSet: Record<
      string,
      { execute: (args: unknown) => Promise<unknown> }
    > = {};
    const executor = {
      handleToolCall: jest.fn(async (_id: unknown, set: typeof toolSet) => {
        toolSet = set;

        return {};
      }),
      handleToolsListing: jest.fn(),
    };
    const instructions = {
      buildInstructions: jest.fn().mockResolvedValue('instructions'),
    };
    const service = new McpProtocolService(
      toolRegistry as never,
      {
        getRoleIdForUserWorkspace: jest.fn().mockResolvedValue('role-1'),
      } as never,
      executor as never,
      {} as never,
      {
        findAllFlatSkills: jest.fn().mockResolvedValue([]),
        findFlatSkillsByNames: jest.fn(),
      } as never,
      instructions as never,
      {} as never,
      {
        getOrRecompute: jest.fn().mockResolvedValue({
          flatWorkspaceMemberMaps: { idByUserId: {}, byId: {} },
        }),
      } as never,
    );
    const call = async (
      isPublicRequest: boolean,
      name: string,
      args: unknown,
    ) => {
      await service.handleMCPCoreQuery(
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name, arguments: args },
        } as never,
        {
          workspace,
          userId: 'u-1',
          userWorkspaceId: 'uw-1',
          apiKey: undefined,
          isPublicRequest,
        },
      );

      return toolSet;
    };

    return { service, toolRegistry, instructions, call };
  };

  it('execute_tool refuses the excluded tools on a public request and runs an app tool', async () => {
    const { toolRegistry, call } = setup();
    const set = await call(true, 'execute_tool', {});

    for (const name of [
      'send_email',
      'create_calendar_event',
      'create_complete_workflow',
    ]) {
      const out = (await set.execute_tool.execute({
        toolName: name,
        arguments: {},
      })) as { success: boolean };

      expect(out.success).toBe(false);
    }
    expect(toolRegistry.resolveAndExecute).not.toHaveBeenCalled();

    await set.execute_tool.execute({
      toolName: 'app_tide_email_fill',
      arguments: {},
    });
    expect(toolRegistry.resolveAndExecute).toHaveBeenCalledWith(
      'app_tide_email_fill',
      {},
      expect.anything(),
      expect.anything(),
    );
  });

  it('the public catalog leaves the excluded tools out and keeps the app tools', async () => {
    const { call } = setup();
    const set = await call(true, 'get_tool_catalog', {});
    const out = (await set.get_tool_catalog.execute({})) as {
      catalog: Record<string, { name: string }[]>;
    };
    const names = Object.values(out.catalog)
      .flat()
      .map((t) => t.name);

    expect(names).toEqual(
      expect.arrayContaining(['find_people', 'app_tide_email_fill']),
    );
    expect(names).not.toEqual(expect.arrayContaining(['send_email']));
    expect(names).not.toContain('create_calendar_event');
    expect(names).not.toContain('create_complete_workflow');
  });

  it('a tunnel request keeps upstream behaviour (no extra catalog read, send_email allowed by the role)', async () => {
    const { toolRegistry, call } = setup();
    const set = await call(false, 'execute_tool', {});

    expect(toolRegistry.buildToolIndex).not.toHaveBeenCalledWith(
      'ws-1',
      'role-1',
      expect.objectContaining({ categories: expect.anything() }),
    );
    await set.execute_tool.execute({ toolName: 'send_email', arguments: {} });
    expect(toolRegistry.resolveAndExecute).toHaveBeenCalledWith(
      'send_email',
      {},
      expect.anything(),
      expect.anything(),
    );
  });

  it('initialize passes the public exclusions to the server instructions', async () => {
    const { service, instructions } = setup();

    await service.handleMCPCoreQuery(
      { jsonrpc: '2.0', id: 1, method: 'initialize' } as never,
      {
        workspace,
        userId: 'u-1',
        userWorkspaceId: 'uw-1',
        apiKey: undefined,
        isPublicRequest: true,
      },
    );
    const excluded = instructions.buildInstructions.mock.calls[0][0]
      .excludedToolNames as Set<string>;

    expect(excluded.has('send_email')).toBe(true);
    expect(excluded.has('create_complete_workflow')).toBe(true);
    expect(excluded.has('app_tide_email_fill')).toBe(false);
  });
});
