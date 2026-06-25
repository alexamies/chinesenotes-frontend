# Drawings

This directory contains architectural diagrams in [Graphviz](https://graphviz.org/) dot format.

## Files

| File | Description |
|---|---|
| `architecture.dot` | High-level system architecture |

## Generating PNG output

Install Graphviz if not already present:

```shell
# macOS
brew install graphviz

# Debian / Ubuntu
sudo apt-get install graphviz
```

Render the architecture diagram to PNG from the project root:

```shell
dot -Tpng drawings/architecture.dot -o drawings/architecture.png
```

Open `drawings/architecture.png` to view the result.
