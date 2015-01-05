require 'test_helper'

class DaysControllerTest < ActionController::TestCase

  def setup
    Day.delete_all
  end

  test 'should get index' do
    get :index

    assert_response :success
    assert_not_nil assigns(:days)
  end

  test 'should post create' do
    assert_difference('Day.count') do
      post :create, day: { date: Date.parse('2014-06-23'), count: 11 }
    end

    assert_not_nil assigns(:day)
    assert_redirected_to day_path(assigns(:day))
  end

end
