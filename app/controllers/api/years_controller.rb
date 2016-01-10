module Api
  class YearsController < ApplicationController

    # GET /api/years.json
    def index
      @years = Year.find_stuff
    end

  end
end
