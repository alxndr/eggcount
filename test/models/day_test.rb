require 'test_helper'

class DayTest < ActiveSupport::TestCase

  test 'requires fields' do
    day = Day.new
    assert_not day.save, 'Saved day record without fields'
  end

end
