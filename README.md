# Repository Monitor Action

This Github action generates custom metrics reports including the last releases using GitHub Pages.

Please note, this action **will commit changes to the `gh-pages` branch** and use subfolders to save the metrics.

## Usage

The following steps generate some data and push them through the action to Pages:

```
steps:
    - uses: actions/checkout@v2.3.1
    - name: Calculate project metrics
      id: projectmetrics
      run: |
        yarn
        yarn build
        SIZE=($(du -s dist/))
        echo "::set-output name=code_size::$SIZE"
    - uses: floric/repo-monitor-action@v1.4.1
      name: Update Report
      with:
        key: code-size
        value: ${{ steps.projectmetrics.outputs.code_size }}
        token: ${{ secrets.GITHUB_TOKEN }}
```

The metrics need to be configured with a custom config:

https://github.com/cymetrics/monitor-action/blob/master/.github/repo-monitor-action/config.yml

The following config whould show the codesize as described in the action above:

```
metrics:
  code-size:
    description: Size of all source files in KB
groups:
  general:
    name: General
    description: This section shows code complexity metrics
    metrics:
      - code-size
```
