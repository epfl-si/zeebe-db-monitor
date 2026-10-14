{ pkgs, lib, config, inputs, ... }:

{
  # https://devenv.sh/basics/
  env.GREET = "devenv";

  dotenv.enable = true;

  # https://devenv.sh/packages/
  packages = with pkgs; [
   nodejs_24
   typescript
   tsx
   rocksdb.tools  # providing the 'ldb' command
   ];

  enterShell = ''
    if [ -z "$DEVENV_WELCOME_SHOWN" ]; then
      export DEVENV_WELCOME_SHOWN=1

      echo ""
      echo "👋  Welcome to the Zeebe DB Monitor development environment!"
      echo ""
      echo "🚀  Getting started: README.md"
    fi
  '';
}
