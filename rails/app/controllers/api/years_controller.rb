module Api
  class YearsController < ApplicationController

    # GET /api/years.json
    def index
      @years = Year.find_stuff
      expires_in 5.minutes, public: true
    end

  end
end
