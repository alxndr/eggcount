Dynamo.under_test(Eggcount.Dynamo)
Dynamo.Loader.enable
ExUnit.start

defmodule Eggcount.TestCase do
  use ExUnit.CaseTemplate

  # Enable code reloading on test cases
  setup do
    Dynamo.Loader.enable
    :ok
  end
end
