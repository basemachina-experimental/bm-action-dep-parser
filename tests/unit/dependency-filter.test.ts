import { filterViewDependencies, filterActionDependencies } from '../../lib/dependency-filter';
import { ViewDependency, JavaScriptActionDependency } from '../../analyze-action-dependencies';

describe('filterViewDependencies', () => {
  it('should filter view dependencies by a single action identifier', () => {
    const dependencies: ViewDependency[] = [
      {
        entrypoint: 'pages/Page1.tsx',
        dependencies: {
          direct: ['action1', 'action2'],
          indirect: {}
        }
      },
      {
        entrypoint: 'pages/Page2.tsx',
        dependencies: {
          direct: ['action3'],
          indirect: {}
        }
      },
      {
        entrypoint: 'pages/Page3.tsx',
        dependencies: {
          direct: [],
          indirect: {
            'components/Component1.tsx': ['action1']
          }
        }
      }
    ];

    const result = filterViewDependencies(dependencies, ['action1']);

    expect(result.filtered).toHaveLength(2);
    expect(result.filtered.map(d => d.entrypoint)).toContain('pages/Page1.tsx');
    expect(result.filtered.map(d => d.entrypoint)).toContain('pages/Page3.tsx');
    expect(result.warnings).toHaveLength(0);
  });

  it('should filter view dependencies by multiple action identifiers (OR logic)', () => {
    const dependencies: ViewDependency[] = [
      {
        entrypoint: 'pages/Page1.tsx',
        dependencies: {
          direct: ['action1'],
          indirect: {}
        }
      },
      {
        entrypoint: 'pages/Page2.tsx',
        dependencies: {
          direct: ['action2'],
          indirect: {}
        }
      },
      {
        entrypoint: 'pages/Page3.tsx',
        dependencies: {
          direct: ['action3'],
          indirect: {}
        }
      }
    ];

    const result = filterViewDependencies(dependencies, ['action1', 'action2']);

    expect(result.filtered).toHaveLength(2);
    expect(result.filtered.map(d => d.entrypoint)).toContain('pages/Page1.tsx');
    expect(result.filtered.map(d => d.entrypoint)).toContain('pages/Page2.tsx');
  });

  it('should warn when action identifier is not found', () => {
    const dependencies: ViewDependency[] = [
      {
        entrypoint: 'pages/Page1.tsx',
        dependencies: {
          direct: ['action1'],
          indirect: {}
        }
      }
    ];

    const result = filterViewDependencies(dependencies, ['nonexistent']);

    expect(result.filtered).toHaveLength(0);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toContain("Warning: Action identifier 'nonexistent' not found");
    expect(result.warnings[1]).toContain('No dependencies found');
  });

  it('should filter partially when some identifiers exist', () => {
    const dependencies: ViewDependency[] = [
      {
        entrypoint: 'pages/Page1.tsx',
        dependencies: {
          direct: ['action1'],
          indirect: {}
        }
      }
    ];

    const result = filterViewDependencies(dependencies, ['action1', 'nonexistent']);

    expect(result.filtered).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("Warning: Action identifier 'nonexistent' not found");
  });

  it('should filter dependencies array to show only matching actions', () => {
    const dependencies: ViewDependency[] = [
      {
        entrypoint: 'pages/Page1.tsx',
        dependencies: {
          direct: ['action1', 'action2', 'action3'],
          indirect: {
            'components/Component1.tsx': ['action4', 'action5']
          }
        }
      }
    ];

    const result = filterViewDependencies(dependencies, ['action1', 'action4']);

    expect(result.filtered).toHaveLength(1);
    expect(result.filtered[0].dependencies.direct).toEqual(['action1']);
    expect(result.filtered[0].dependencies.indirect).toEqual({
      'components/Component1.tsx': ['action4']
    });
  });
});

describe('filterActionDependencies', () => {
  it('should filter action dependencies by a single action identifier', () => {
    const dependencies: JavaScriptActionDependency[] = [
      {
        entrypoint: 'action1.js',
        dependencies: {
          direct: ['action2'],
          indirect: {}
        }
      },
      {
        entrypoint: 'action3.js',
        dependencies: {
          direct: ['action4'],
          indirect: {}
        }
      }
    ];

    const result = filterActionDependencies(dependencies, ['action2']);

    expect(result.filtered).toHaveLength(1);
    expect(result.filtered[0].entrypoint).toBe('action1.js');
  });

  it('should include the target action itself if it exists in dependencies', () => {
    const dependencies: JavaScriptActionDependency[] = [
      {
        entrypoint: 'action1.js',
        dependencies: {
          direct: ['action2'],
          indirect: {}
        }
      },
      {
        entrypoint: 'action2.js',
        dependencies: {
          direct: ['action3'],
          indirect: {}
        }
      }
    ];

    const result = filterActionDependencies(dependencies, ['action2']);

    expect(result.filtered).toHaveLength(2);
    expect(result.filtered.map(d => d.entrypoint)).toContain('action1.js');
    expect(result.filtered.map(d => d.entrypoint)).toContain('action2.js');
  });
});
